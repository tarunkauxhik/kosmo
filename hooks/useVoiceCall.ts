"use client";

// Direct-to-provider voice call:
//   mic → ScriptProcessor (PCM16) → Deepgram Flux websocket (STT, Hindi + English),
//     authenticated with a short-lived token from /api/voice/deepgram-token
//   on end of turn → Convex action calls.respond (persona + history live server-side), which streams
//     the reply into a bot turn this hook follows through the calls.liveReply query
//   each complete sentence → /api/voice/silk-mint → Rumik SILK websocket → Web Audio, played in order

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type CallPhase = "connecting" | "live" | "error";
export type CallActivity = "listening" | "thinking" | "speaking";

function friendlyError(err: unknown) {
    const m = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
    if (m.includes("permission") || m.includes("notallowed") || m.includes("denied"))
        return "Kosmo needs your microphone for calls. Allow it in your browser's site settings, then try again.";
    if (m.includes("timed out"))
        return "The microphone prompt timed out. Use the mic icon in the address bar to allow access, then try again.";
    if ((err as { data?: { kind?: string } })?.data?.kind === "RateLimited")
        return "You've started several calls in a short time. Wait a minute, then try again.";
    if (m.includes("speech recognition"))
        return "Voice recognition isn't available right now. Try again shortly, or use chat instead.";
    return "The call couldn't connect. Check your connection and try again.";
}

export function useVoiceCall(counsellorSlug: string) {
    const [phase, setPhase] = useState<CallPhase>("connecting");
    const [activity, setActivity] = useState<CallActivity>("listening");
    const [error, setError] = useState<string | null>(null);
    const [captions, setCaptions] = useState<{ user: string | null; assistant: string | null }>({
        user: null,
        assistant: null,
    });
    const [muted, setMuted] = useState(false);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    // The turn whose streamed reply is being followed.
    const [live, setLive] = useState<{ callId: Id<"calls">; turnKey: string } | null>(null);
    const liveReply = useQuery(api.calls.liveReply, live ?? "skip");

    const startCall = useMutation(api.calls.start);
    const respond = useAction(api.calls.respond);
    const endCall = useMutation(api.calls.end);

    // Element whose --level CSS var tracks mic loudness (0..1), written outside React renders.
    const levelRef = useRef<HTMLElement | null>(null);
    const mutedRef = useRef(false);
    const callIdRef = useRef<Id<"calls"> | null>(null);
    const callIdPromiseRef = useRef<Promise<Id<"calls">> | null>(null);
    const turnGenRef = useRef(0);
    const dgWsRef = useRef<WebSocket | null>(null);
    const micCtxRef = useRef<AudioContext | null>(null);
    const micProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const ttsWsRef = useRef<WebSocket | null>(null);
    const ttsSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const playAtRef = useRef(0);
    const ttsGenRef = useRef(0);
    // How much of the current turn's reply has been handed to TTS, and whether the reply is complete.
    const feedRef = useRef<{ key: string; consumed: number; done: boolean } | null>(null);
    // Reply pieces play strictly in order: each waits for the previous one's audio to be scheduled.
    const queueRef = useRef<Promise<void>>(Promise.resolve());
    const pendingRef = useRef(0);

    // Stops speech and drops whatever is left of the current reply (barge-in, new turn, hang-up).
    const stopPlayback = useCallback(() => {
        ttsGenRef.current += 1;
        feedRef.current = null;
        queueRef.current = Promise.resolve();
        pendingRef.current = 0;
        if (ttsWsRef.current?.readyState === WebSocket.OPEN) {
            try {
                ttsWsRef.current.close();
            } catch {}
        }
        ttsWsRef.current = null;
        for (const src of ttsSourcesRef.current) {
            try {
                src.stop();
            } catch {}
        }
        ttsSourcesRef.current = [];
        if (audioCtxRef.current) playAtRef.current = audioCtxRef.current.currentTime;
        setActivity((a) => (a === "speaking" ? "listening" : a));
    }, []);

    // Back to listening once the reply is complete and every piece has finished playing.
    const settleIfDone = useCallback(() => {
        const feed = feedRef.current;
        if (ttsSourcesRef.current.length || pendingRef.current || (feed && !feed.done)) return;
        setActivity("listening");
    }, []);

    const appendCaption = useCallback((text: string) => {
        setCaptions((c) => ({ ...c, assistant: c.assistant ? `${c.assistant} ${text}` : text }));
    }, []);

    const mintSpeech = useCallback(
        async (text: string) => {
            const res = await fetch("/api/voice/silk-mint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, counsellorSlug }),
            });
            if (!res.ok) {
                console.error("silk-mint failed", res.status);
                return null;
            }
            return (await res.json()) as {
                ws_url: string;
                token: string;
                model: string;
                tone: string | null;
                description: string | null;
            };
        },
        [counsellorSlug],
    );

    // Streams one piece of the reply into the audio timeline. Resolves once all of its audio has
    // arrived (it may still be playing), so the next piece is scheduled right after it.
    const playPiece = useCallback(
        async (text: string, minted: ReturnType<typeof mintSpeech>, gen: number) => {
            const session = await minted.catch(() => null);
            if (gen !== ttsGenRef.current) return;
            if (!session) {
                // No voice for this piece: still show the words.
                appendCaption(text);
                setActivity((a) => (a === "thinking" ? "listening" : a));
                return;
            }

            const ctx = audioCtxRef.current ?? new AudioContext({ sampleRate: 24000 });
            audioCtxRef.current = ctx;
            if (ctx.state === "suspended") await ctx.resume();
            if (playAtRef.current < ctx.currentTime) playAtRef.current = ctx.currentTime;

            // muga expects a [tone] prefix; mulberry uses the description field instead
            const isMuga = session.model === "muga";
            const synthesisText =
                isMuga && !text.trimStart().startsWith("[") ? `[${session.tone || "neutral"}] ${text}` : text;

            await new Promise<void>((resolve) => {
                const ws = new WebSocket(`${session.ws_url}?token=${encodeURIComponent(session.token)}`);
                ws.binaryType = "arraybuffer";
                ttsWsRef.current = ws;
                let captioned = false;

                ws.onopen = () => {
                    if (gen !== ttsGenRef.current) return ws.close();
                    const frame: Record<string, unknown> = { text: synthesisText };
                    if (!isMuga && session.description) frame.description = session.description;
                    ws.send(JSON.stringify(frame));
                };

                ws.onmessage = (e) => {
                    if (gen !== ttsGenRef.current) return ws.close();
                    if (e.data instanceof ArrayBuffer) {
                        const pcm = new Int16Array(e.data);
                        if (!pcm.length) return;
                        const buf = ctx.createBuffer(1, pcm.length, 24000);
                        const ch = buf.getChannelData(0);
                        for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
                        const src = ctx.createBufferSource();
                        src.buffer = buf;
                        src.connect(ctx.destination);
                        const startAt = Math.max(playAtRef.current, ctx.currentTime);
                        src.start(startAt);
                        playAtRef.current = startAt + buf.duration;
                        ttsSourcesRef.current.push(src);
                        if (!captioned) {
                            // Show this piece's words when its audio starts playing, not when it is queued.
                            captioned = true;
                            setTimeout(
                                () => {
                                    if (gen !== ttsGenRef.current) return;
                                    appendCaption(text);
                                    setActivity("speaking");
                                },
                                Math.max(0, (startAt - ctx.currentTime) * 1000),
                            );
                        }
                        src.onended = () => {
                            ttsSourcesRef.current = ttsSourcesRef.current.filter((x) => x !== src);
                            if (gen === ttsGenRef.current) settleIfDone();
                        };
                    } else {
                        try {
                            const data = JSON.parse(e.data);
                            if (data?.type === "done" || data?.error) ws.close();
                        } catch {}
                    }
                };

                ws.onerror = (err) => console.error("SILK ws error", err);
                ws.onclose = () => {
                    if (ttsWsRef.current === ws) ttsWsRef.current = null;
                    // Synthesis produced no audio: still show the words.
                    if (!captioned && gen === ttsGenRef.current) appendCaption(text);
                    resolve();
                };
            });
        },
        [appendCaption, settleIfDone],
    );

    // Queues a piece of the reply. Minting starts at once, so it overlaps with earlier pieces playing.
    const enqueueSpeech = useCallback(
        (text: string) => {
            const gen = ttsGenRef.current;
            const minted = mintSpeech(text);
            pendingRef.current += 1;
            queueRef.current = queueRef.current
                .then(() => (gen === ttsGenRef.current ? playPiece(text, minted, gen) : undefined))
                .finally(() => {
                    if (gen !== ttsGenRef.current) return;
                    pendingRef.current -= 1;
                    settleIfDone();
                });
        },
        [mintSpeech, playPiece, settleIfDone],
    );

    // Hands newly completed sentences of the streaming reply to TTS, and the rest once it is final.
    const feedReply = useCallback(
        (turnKey: string, text: string, final: boolean) => {
            const feed = feedRef.current;
            if (!feed || feed.key !== turnKey || feed.done) return;
            const rest = text.slice(feed.consumed);
            let end = 0;
            if (final) {
                end = rest.length;
            } else {
                const boundary = /[.!?।]+["'”’)]*\s+/g;
                for (let m = boundary.exec(rest); m; m = boundary.exec(rest)) {
                    // "Pt. Devrajit" or "Dr. Rao" is not the end of a sentence.
                    if (/(^|\s)[A-Z][a-z]{0,3}\.$/.test(rest.slice(0, m.index + 1))) continue;
                    end = m.index + m[0].length;
                }
                // Very short pieces sound choppy and each costs a TTS session; wait for more text.
                if (rest.slice(0, end).trim().length < 20) end = 0;
            }
            const piece = rest.slice(0, end).trim();
            feed.consumed += end;
            if (final) feed.done = true;
            if (piece) enqueueSpeech(piece);
            else if (final) settleIfDone();
        },
        [enqueueSpeech, settleIfDone],
    );

    useEffect(() => {
        if (live && liveReply) feedReply(live.turnKey, liveReply.text, !liveReply.streaming);
    }, [live, liveReply, feedReply]);

    const ensureCallStarted = useCallback(async (): Promise<Id<"calls">> => {
        if (callIdRef.current) return callIdRef.current;
        if (!callIdPromiseRef.current) {
            callIdPromiseRef.current = startCall({ counsellorSlug })
                .then((id) => {
                    callIdRef.current = id;
                    return id;
                })
                .catch((e) => {
                    callIdPromiseRef.current = null;
                    throw e;
                });
        }
        return callIdPromiseRef.current;
    }, [startCall, counsellorSlug]);

    // One turn: send the caller's words (or the kickoff) to Convex and speak the reply as it streams.
    // A newer turn supersedes an older one, so a stale reply is never spoken.
    const handleUserTurn = useCallback(
        async (userText: string | null) => {
            const trimmed = userText?.trim() ?? "";
            const kickoff = userText === null;
            if (!kickoff && !trimmed) return;

            const myTurn = ++turnGenRef.current;
            const turnKey = crypto.randomUUID();
            stopPlayback();
            feedRef.current = { key: turnKey, consumed: 0, done: false };
            setCaptions((c) => ({ user: kickoff ? c.user : trimmed, assistant: null }));
            setActivity("thinking");

            try {
                const callId = await ensureCallStarted();
                if (myTurn !== turnGenRef.current) return;
                setLive({ callId, turnKey });
                const { reply } = await respond(
                    kickoff ? { callId, kickoff: true, turnKey } : { callId, text: trimmed, turnKey },
                );
                // The live query normally delivers the reply first; this covers a missed update.
                if (myTurn === turnGenRef.current) feedReply(turnKey, reply, true);
            } catch (e) {
                if (myTurn !== turnGenRef.current) return;
                console.error("[voice] turn failed", e);
                feedRef.current = null;
                if ((e as { data?: unknown })?.data === "Call has ended") {
                    // The server closed this call after a long silence (calls.endStale); stop listening.
                    dgWsRef.current?.close();
                    setPhase("error");
                    setError("This call ended after a long silence. Start it again to keep talking.");
                    return;
                }
                setActivity("listening");
                const limited = (e as { data?: { kind?: string } })?.data?.kind === "RateLimited";
                setCaptions((c) => ({
                    ...c,
                    assistant: limited
                        ? "One moment, I'm still catching up. Say that again in a few seconds."
                        : "I didn't catch a reply just now. Could you say that again?",
                }));
            }
        },
        [ensureCallStarted, respond, stopPlayback, feedReply],
    );

    useEffect(() => {
        // No ref-guard here: React Strict Mode mounts twice in dev, and the first
        // cleanup tears everything down, so the second mount must re-initialise.
        let cancelled = false;

        (async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) throw new Error("permission: no microphone API");
                const stream = await Promise.race([
                    navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    }),
                    new Promise<MediaStream>((_, rej) =>
                        setTimeout(() => rej(new Error("Microphone permission timed out")), 10000),
                    ),
                ]);
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                // Create the call first so a missing persona fails before the mic opens.
                await ensureCallStarted();

                const tokenRes = await fetch("/api/voice/deepgram-token", { method: "POST" });
                const tokenBody = await tokenRes.json().catch(() => ({}));
                if (!tokenRes.ok || !tokenBody.accessToken) {
                    throw new Error(`Speech recognition unavailable (${tokenRes.status})`);
                }

                // Flux needs raw PCM linear16; eot_timeout_ms sets how long it waits before EndOfTurn.
                const micCtx = new AudioContext();
                micCtxRef.current = micCtx;
                const params = new URLSearchParams({
                    model: "flux-general-multi",
                    encoding: "linear16",
                    sample_rate: String(micCtx.sampleRate),
                    eot_timeout_ms: "1500",
                });
                params.append("language_hint", "hi");
                params.append("language_hint", "en");

                const dgWs = new WebSocket(`wss://api.deepgram.com/v2/listen?${params.toString()}`, [
                    "bearer",
                    tokenBody.accessToken,
                ]);
                dgWsRef.current = dgWs;
                let interimBuf = "";

                dgWs.onopen = () => {
                    if (cancelled) {
                        try {
                            dgWs.close();
                        } catch {}
                        return;
                    }
                    const source = micCtx.createMediaStreamSource(stream);
                    micSourceRef.current = source;
                    const processor = micCtx.createScriptProcessor(4096, 1, 1);
                    micProcessorRef.current = processor;
                    source.connect(processor);
                    // gain=0 so audio flows to Flux without echoing back to the caller
                    const mute = micCtx.createGain();
                    mute.gain.value = 0;
                    processor.connect(mute);
                    mute.connect(micCtx.destination);

                    processor.onaudioprocess = (e) => {
                        if (dgWs.readyState !== WebSocket.OPEN) return;
                        const f32 = e.inputBuffer.getChannelData(0);
                        const i16 = new Int16Array(f32.length);
                        let sum = 0;
                        // While muted, keep the stream alive with silence.
                        if (!mutedRef.current) {
                            for (let i = 0; i < f32.length; i++) {
                                const s = Math.max(-1, Math.min(1, f32[i]));
                                i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                                sum += s * s;
                            }
                        }
                        dgWs.send(i16.buffer);
                        const level = Math.min(1, Math.sqrt(sum / f32.length) * 6);
                        levelRef.current?.style.setProperty("--level", level.toFixed(3));
                    };

                    setPhase("live");
                    setStartedAt(Date.now());
                    // The persona greets first; the server builds the greeting prompt.
                    handleUserTurn(null);
                };

                dgWs.onmessage = (e) => {
                    let msg: { type?: string; event?: string; transcript?: string };
                    try {
                        msg = JSON.parse(e.data);
                    } catch {
                        return;
                    }
                    if (msg.type === "TurnInfo") {
                        const text = (msg.transcript || "").trim();
                        if (msg.event === "Update" && text) {
                            setCaptions((c) => ({ ...c, user: text }));
                            stopPlayback();
                            interimBuf = text;
                        } else if (msg.event === "EndOfTurn" || msg.event === "EagerEndOfTurn") {
                            const final = (text || interimBuf).trim();
                            interimBuf = "";
                            if (final) {
                                stopPlayback();
                                handleUserTurn(final);
                            }
                        } else if (msg.event === "StartOfTurn" || msg.event === "TurnResumed") {
                            stopPlayback();
                        }
                    } else if (msg.type === "Error") {
                        console.error("[voice] dg error:", msg);
                    }
                };

                dgWs.onerror = (err) => {
                    console.error("DG ws error", err);
                    setPhase("error");
                    setError(friendlyError(new Error("speech recognition")));
                };
            } catch (err) {
                if (cancelled) return; // expected during strict-mode unmount
                console.error("[voice] bootstrap failed", err);
                // Close the call record right away so history doesn't show it as in progress.
                const id = callIdRef.current;
                callIdRef.current = null;
                callIdPromiseRef.current = null;
                if (id) endCall({ callId: id }).catch(() => {});
                setPhase("error");
                setError(friendlyError(err));
            }
        })();

        return () => {
            cancelled = true;
            stopPlayback();
            turnGenRef.current += 1;
            if (micProcessorRef.current) {
                try {
                    micProcessorRef.current.disconnect();
                } catch {}
                micProcessorRef.current.onaudioprocess = null;
                micProcessorRef.current = null;
            }
            try {
                micSourceRef.current?.disconnect();
            } catch {}
            micSourceRef.current = null;
            micCtxRef.current?.close().catch(() => {});
            micCtxRef.current = null;
            try {
                dgWsRef.current?.close();
            } catch {}
            dgWsRef.current = null;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            audioCtxRef.current?.close().catch(() => {});
            audioCtxRef.current = null;
            const id = callIdRef.current;
            callIdRef.current = null;
            callIdPromiseRef.current = null;
            if (id) endCall({ callId: id }).catch((e) => console.error("[voice] end call (cleanup) failed", e));
        };
    }, [handleUserTurn, ensureCallStarted, stopPlayback, endCall]);

    const toggleMute = useCallback(() => {
        setMuted((m) => {
            mutedRef.current = !m;
            return !m;
        });
    }, []);

    // Ends the call and returns its id (if one was created) so the caller can route to the transcript.
    const end = useCallback(() => {
        const id = callIdRef.current;
        callIdRef.current = null; // so the unmount cleanup doesn't end it twice
        if (id) endCall({ callId: id }).catch((e) => console.error("[voice] end call failed", e));
        return id;
    }, [endCall]);

    return { phase, activity, error, captions, muted, toggleMute, end, startedAt, levelRef };
}
