'use strict';

const audio = document.querySelector('#audio');
const stage = document.querySelector('#experience');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const start = document.querySelector('#start');
const pause = document.querySelector('#pause');
const seek = document.querySelector('#seek');
const gentle = document.querySelector('#gentle');

let active = false;
let frame;
let last = 0;
let w = 0;
let h = 0;
let fadeTimer;
let playTimer;
let session = 0;

let audioContext;
let analyser;
let spectrum;
let waveform;

let loudness = 0;
let lowEnd = 0;
let impact = 0;
let baseline = 0;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
gentle.checked = reduced;

function resize()
{
    w = innerWidth;
    h = innerHeight;

    const ratio = Math.min(devicePixelRatio || 1, 2);

    canvas.width = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

addEventListener('resize', resize);
resize();

async function connectAudio()
{
    if (!audioContext)
    {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;

        audioContext = new AudioEngine();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.55;

        const source = audioContext.createMediaElementSource(audio);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        spectrum = new Uint8Array(analyser.frequencyBinCount);
        waveform = new Float32Array(analyser.fftSize);
    }

    await audioContext.resume();
}

function resetResponse()
{
    loudness = 0;
    lowEnd = 0;
    impact = 0;
    baseline = 0;
}

function sampleMusic(dt)
{
    if (!analyser || audio.paused)
    {
        return;
    }

    analyser.getByteFrequencyData(spectrum);
    analyser.getFloatTimeDomainData(waveform);

    let power = 0;

    for (const value of waveform)
    {
        power += value * value;
    }

    const rms = Math.sqrt(power / waveform.length);
    const spacing = audioContext.sampleRate / analyser.fftSize;

    let bass = 0;
    let count = 0;

    for (
        let index = Math.ceil(35 / spacing);
        index <= Math.floor(180 / spacing);
        index++
    )
    {
        bass += spectrum[index] / 255;
        count++;
    }

    bass /= Math.max(count, 1);

    const volume = Math.min(1, Math.pow(rms * 3.8, 0.8));

    loudness += (volume - loudness)
        * (1 - Math.exp(-dt * (volume > loudness ? 22 : 5)));

    lowEnd += (bass - lowEnd)
        * (1 - Math.exp(-dt * (bass > lowEnd ? 24 : 7)));

    const onset = rms > 0.002
        ? Math.max(0, bass - baseline - 0.035)
        : 0;

    baseline += (bass - baseline) * (1 - Math.exp(-dt * 2));

    impact = Math.max(
        impact * Math.exp(-dt * 7),
        Math.min(1, onset * 3)
    );
}

function renderGraphic(time, volume, bass, hit)
{
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, w, h);

    const quiet = gentle.checked;
    const motion = time * (quiet ? 0.25 : 1);
    const intensity = quiet ? 0.35 : 1;
    const unit = Math.min(w, h) * 0.34;

    const pulse = 1 + intensity
        * (volume * 0.065 + bass * 0.085 + hit * 0.16);

    const brightness = 0.28 + volume * 0.62;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(pulse, pulse);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let band = 0; band < 28; band++)
    {
        const offset = band / 28;
        const phase = offset * Math.PI * 2;
        const hue = band % 3 === 0 ? 355 : 29;
        const opacity = brightness * (quiet ? 0.75 : 1);

        ctx.strokeStyle =
            `hsla(${hue},85%,${58 + volume * 12}%,${opacity})`;

        ctx.lineWidth = Math.max(1, unit / 140)
            + volume * 0.6
            + hit * intensity;

        ctx.beginPath();

        for (let point = 0; point <= 160; point++)
        {
            const angle = point / 160 * Math.PI * 2;
            const ripple = 0.045 + bass * 0.012 * intensity;

            const radius = unit * (
                0.2
                + offset * 0.85
                + ripple * Math.sin(angle * 7 - motion * 2 + phase)
            );

            const twisted = angle
                + motion * 0.2
                + Math.sin(angle * 3 - motion)
                    * (0.06 + hit * 0.018 * intensity);

            const x = radius * Math.cos(twisted);
            const y = radius * Math.sin(twisted);

            if (point === 0)
            {
                ctx.moveTo(x, y);
            }
            else
            {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.stroke();
    }

    for (let dot = 0; dot < 12; dot++)
    {
        const angle = dot / 12 * Math.PI * 2 + motion * 0.4;
        const radius = unit
            * (1.1 + 0.04 * Math.sin(motion * 3 + dot));

        ctx.fillStyle = `hsla(9,85%,72%,${0.25 + volume * 0.6})`;
        ctx.beginPath();

        ctx.arc(
            radius * Math.cos(angle),
            radius * Math.sin(angle),
            2 + volume * 3 + hit * intensity * 2,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}

function draw(now)
{
    if (!active)
    {
        return;
    }

    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;

    sampleMusic(dt);
    renderGraphic(audio.currentTime, loudness, lowEnd, impact);

    seek.value = audio.currentTime;

    const time = audio.currentTime;

    document.querySelector('#time').textContent =
        `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

    frame = requestAnimationFrame(draw);
}

function updateDuration()
{
    if (Number.isFinite(audio.duration))
    {
        seek.max = audio.duration;
    }
}

audio.addEventListener('loadedmetadata', updateDuration);
updateDuration();

async function enter()
{
    const token = ++session;

    clearTimeout(fadeTimer);
    start.disabled = true;
    document.querySelector('#status').textContent = 'Loading music…';

    try
    {
        await connectAudio();

        if (token !== session)
        {
            return;
        }

        resetResponse();
        updateDuration();

        stage.classList.add('open');
        stage.setAttribute('aria-hidden', 'false');
        document.querySelector('#portfolio').inert = true;
        document.querySelector('#exit').focus();

        active = true;
        last = 0;
        audio.currentTime = 0;
        pause.textContent = 'Pause';

        frame = requestAnimationFrame(draw);

        playTimer = setTimeout(async () =>
        {
            if (token !== session)
            {
                return;
            }

            try
            {
                await audio.play();
                document.querySelector('#status').textContent = '';
            }
            catch (error)
            {
                close();

                document.querySelector('#status').textContent =
                    'Playback could not start. Please try Play again.';
            }
        }, reduced ? 200 : 950);
    }
    catch (error)
    {
        document.querySelector('#status').textContent =
            'Could not load the music. Please reload the page and try again.';
    }
    finally
    {
        start.disabled = false;
    }
}

function close()
{
    session++;
    clearTimeout(playTimer);

    audio.pause();
    active = false;

    cancelAnimationFrame(frame);

    stage.classList.remove('open');
    document.querySelector('#portfolio').inert = false;
    start.focus();

    fadeTimer = setTimeout(() =>
    {
        stage.setAttribute('aria-hidden', 'true');
        ctx.clearRect(0, 0, w, h);
    }, reduced ? 200 : 1000);
}

async function toggle()
{
    if (audio.paused)
    {
        try
        {
            await connectAudio();
            await audio.play();
            pause.textContent = 'Pause';
        }
        catch (error)
        {
            pause.textContent = 'Retry play';
        }
    }
    else
    {
        audio.pause();
        pause.textContent = 'Resume';
    }
}

start.addEventListener('click', enter);
document.querySelector('#exit').addEventListener('click', close);
pause.addEventListener('click', toggle);
audio.addEventListener('ended', close);

audio.addEventListener('error', () =>
{
    if (active)
    {
        close();
    }

    document.querySelector('#status').textContent =
        'Could not load young-turks.mp3.';
});

seek.addEventListener('input', () =>
{
    audio.currentTime = Number(seek.value);
    resetResponse();
});

document.addEventListener('keydown', event =>
{
    if (!active)
    {
        return;
    }

    if (event.key === 'Escape')
    {
        close();
    }

    if (
        event.code === 'Space'
        && !['INPUT', 'BUTTON'].includes(event.target.tagName)
    )
    {
        event.preventDefault();
        toggle();
    }

    if (event.key === 'Tab')
    {
        const nodes = [...stage.querySelectorAll('button,input')];
        const first = nodes[0];
        const end = nodes[nodes.length - 1];

        if (event.shiftKey && document.activeElement === first)
        {
            event.preventDefault();
            end.focus();
        }
        else if (!event.shiftKey && document.activeElement === end)
        {
            event.preventDefault();
            first.focus();
        }
    }
});