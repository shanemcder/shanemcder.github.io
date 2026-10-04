'use strict';

const audio = document.querySelector('#audio');
const stage = document.querySelector('#experience');
const canvas = document.querySelector('#lights');
const ctx = canvas.getContext('2d');
const trackButtons = [...document.querySelectorAll('.track-play')];
const pause = document.querySelector('#pause');
const gentle = document.querySelector('#gentle');
const portfolio = document.querySelector('#portfolio');
const exit = document.querySelector('#exit');
const status = document.querySelector('#status');
const caption = document.querySelector('.caption');

let selectedButton = trackButtons[0];
let active = false;
let frame;
let last = 0;
let w = 0;
let h = 0;
let fadeTimer;
let session = 0;
let starting = false;

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

    if (waveform)
    {
        waveform.fill(0);
    }
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

function readWave(position)
{
    if (!waveform)
    {
        return 0;
    }

    const length = waveform.length;
    const wrapped = ((position % length) + length) % length;
    const sample = Math.floor(wrapped);
    const next = (sample + 1) % length;
    const fraction = wrapped - sample;

    return waveform[sample] * (1 - fraction)
        + waveform[next] * fraction;
}

function ringWave(angle, band)
{
    if (!waveform)
    {
        return 0;
    }

    const center = waveform.length * 0.5;
    const span = waveform.length * 0.42;
    const shift = band * 19;

    const position = center
        + Math.cos(angle) * span
        + shift;

    return readWave(position) * 0.6
        + readWave(position + 4) * 0.2
        + readWave(position - 4) * 0.2;
}

function renderGraphic(time, volume, bass, hit)
{
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, w, h);

    const quiet = gentle.checked;
    const motion = time * (quiet ? 0.25 : 1);
    const intensity = quiet ? 0.25 : 1;
    const unit = Math.min(w, h) * 0.29;
    const energy = volume * 0.45 + bass * 0.55;

    const pulse = 1 + intensity * (
        volume * 0.10
        + bass * 0.15
        + hit * 0.30
    );

    const swayX = Math.sin(motion * 1.3)
        * unit * energy * 0.065 * intensity;

    const swayY = Math.cos(motion * 1.7)
        * unit * energy * 0.065 * intensity;

    const stretch = Math.sin(motion * 2.4)
        * energy * 0.07 * intensity;

    const brightness = 0.28 + volume * 0.62;
    const baseHue = (355 + time * 8) % 360;

    ctx.save();
    ctx.translate(w / 2 + swayX, h / 2 + swayY);
    ctx.rotate(Math.sin(motion * 0.8) * energy * 0.12 * intensity);
    ctx.scale(pulse * (1 + stretch), pulse * (1 - stretch));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let band = 0; band < 28; band++)
    {
        const offset = band / 28;
        const phase = offset * Math.PI * 2;
        const hue = (baseHue + (band % 3 === 0 ? 0 : 34)) % 360;
        const opacity = brightness * (quiet ? 0.75 : 1);

        const ringBounce = Math.sin(motion * 3.5 - phase * 2)
            * energy * 0.025 * intensity;

        const ringResponse = 0.65 + offset * 0.9;
        const waveStrength = quiet ? 0.025 : 0.16;

        ctx.strokeStyle =
            `hsla(${hue},85%,${58 + volume * 12}%,${opacity})`;

        ctx.lineWidth = Math.max(1, unit / 140)
            + volume * 0.7
            + hit * intensity * 1.3;

        ctx.beginPath();

        for (let point = 0; point <= 240; point++)
        {
            const angle = point / 240 * Math.PI * 2;
            const wave = ringWave(angle, band);

            const primaryRipple = (
                0.045 + bass * 0.025 * intensity
            ) * Math.sin(angle * 7 - motion * 2 + phase);

            const looseRipple = Math.sin(
                angle * 3 + motion * 1.8 - phase
            ) * energy * 0.035 * intensity;

            const impactRipple = Math.sin(
                angle * 5 - phase * 2 + motion * 4
            ) * hit * 0.035 * intensity;

            const radius = unit * Math.max(
                0.08,
                0.2
                + offset * 0.85
                + ringBounce
                + primaryRipple
                + looseRipple
                + impactRipple
                + wave * waveStrength * ringResponse
            );

            const twisted = angle
                + motion * 0.2
                + Math.sin(angle * 3 - motion)
                    * (0.06 + hit * 0.045 * intensity)
                + Math.sin(motion * 1.4 + phase)
                    * energy * 0.045 * intensity;

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
        const phase = dot / 12 * Math.PI * 2;

        const angle = phase
            + motion * 0.4
            + Math.sin(motion * 2 + phase)
                * energy * 0.12 * intensity;

        const radius = unit * (
            1.13
            + 0.04 * Math.sin(motion * 3 + dot)
            + Math.sin(motion * 4 - phase)
                * energy * 0.07 * intensity
            + hit * 0.10 * intensity
        );

        const dotHue = (baseHue + 18) % 360;

        ctx.fillStyle =
            `hsla(${dotHue},85%,72%,${0.25 + volume * 0.6})`;

        ctx.beginPath();

        ctx.arc(
            radius * Math.cos(angle),
            radius * Math.sin(angle),
            2 + volume * 3 + hit * intensity * 3,
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

    frame = requestAnimationFrame(draw);
}

function lockButtons(locked)
{
    for (const button of trackButtons)
    {
        button.disabled = locked;
    }
}

async function enter(button)
{
    if (starting || active)
    {
        return;
    }

    const token = ++session;

    selectedButton = button;
    starting = true;
    lockButtons(true);
    clearTimeout(fadeTimer);

    status.textContent = `Loading ${button.dataset.title}…`;

    try
    {
        await connectAudio();

        if (token !== session)
        {
            return;
        }

        audio.pause();
        audio.src = button.dataset.src;
        audio.load();

        resetResponse();

        caption.textContent = button.dataset.title.toUpperCase();

        stage.setAttribute(
            'aria-label',
            `${button.dataset.title} audiovisual player`
        );

        stage.classList.add('open');
        stage.setAttribute('aria-hidden', 'false');
        portfolio.inert = true;
        document.body.classList.add('listening');
        exit.focus();

        active = true;
        last = 0;
        pause.textContent = 'Pause';
        pause.disabled = true;

        frame = requestAnimationFrame(draw);

        await audio.play();

        if (token !== session)
        {
            audio.pause();
            return;
        }

        status.textContent = '';
        pause.disabled = false;
    }
    catch (error)
    {
        if (token !== session)
        {
            return;
        }

        close();

        status.textContent =
            `Could not play ${button.dataset.title}. Check that ${button.dataset.src} is in the same folder as index.html.`;
    }
    finally
    {
        if (token === session)
        {
            starting = false;
            lockButtons(false);
        }
    }
}

function close()
{
    session++;
    starting = false;
    lockButtons(false);

    audio.pause();
    active = false;

    cancelAnimationFrame(frame);

    stage.classList.remove('open');
    portfolio.inert = false;
    document.body.classList.remove('listening');
    pause.disabled = false;
    selectedButton.focus();

    clearTimeout(fadeTimer);

    fadeTimer = setTimeout(() =>
    {
        stage.setAttribute('aria-hidden', 'true');
        ctx.clearRect(0, 0, w, h);
    }, reduced ? 200 : 1000);
}

async function toggle()
{
    const token = session;

    if (audio.paused)
    {
        pause.disabled = true;

        try
        {
            await connectAudio();

            if (!active || token !== session)
            {
                return;
            }

            await audio.play();

            if (!active || token !== session)
            {
                audio.pause();
                return;
            }

            pause.textContent = 'Pause';
        }
        catch (error)
        {
            if (active && token === session)
            {
                pause.textContent = 'Retry play';
            }
        }
        finally
        {
            pause.disabled = false;
        }
    }
    else
    {
        audio.pause();
        pause.textContent = 'Resume';
    }
}

for (const button of trackButtons)
{
    button.addEventListener('click', () => enter(button));
}

exit.addEventListener('click', close);
pause.addEventListener('click', toggle);
audio.addEventListener('ended', close);

audio.addEventListener('error', () =>
{
    if (!active && !starting)
    {
        return;
    }

    const title = selectedButton.dataset.title;
    const filename = selectedButton.dataset.src;

    close();

    status.textContent =
        `Could not load ${title}. Check the filename: ${filename}`;
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
        && !pause.disabled
    )
    {
        event.preventDefault();
        toggle();
    }

    if (event.key === 'Tab')
    {
        const nodes = [
            ...stage.querySelectorAll('button:not(:disabled),input')
        ];

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