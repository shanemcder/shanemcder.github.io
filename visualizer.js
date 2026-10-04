'use strict';

const audio = document.querySelector('#audio');
const stage = document.querySelector('#experience');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const start = document.querySelector('#start');
const pause = document.querySelector('#pause');
const seek = document.querySelector('#seek');
const gentle = document.querySelector('#gentle');

const mappings =
{
    '4_guitar': { h: 280, type: 'cloud', change: true },
    ezra_fuzz: { h: 43, type: 'cloud' },
    blitz: { h: 128, type: 'streak' },
    boom_fx: { h: 0, type: 'boom' },
    bright_synth_strings: { h: 330, type: 'laser' },
    chord_arp: { h: 26, type: 'pulse' },
    drums: { h: 9, type: 'drum' },
    ezra_main: { h: 248, type: 'cloud' },
    ne_growl: { h: 355, type: 'pulse' },
    ne_main: { h: 198, type: 'dots' },
    sidechain: { h: 185, type: 'breath' },
    synth_hat: { h: 104, type: 'sparks' },
    synthetic_bass: { h: 49, type: 'bass' },
    bass_drop: { h: 29, type: 'bass' }
};

let data;
let active = false;
let frame;
let last = 0;
let w = 0;
let h = 0;
let fadeTimer;
let playTimer;
let session = 0;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
gentle.checked = reduced;

const ready = fetch('analysis.json')
    .then(response =>
    {
        if (!response.ok)
        {
            throw Error('Analysis unavailable');
        }

        return response.json();
    })
    .then(result =>
    {
        data = result;
        data.tracks = data.tracks
            .filter(track => mappings[track.name])
            .map((track, index) =>
            ({
                ...track,
                ...mappings[track.name],
                seed: index * 2.399,
                energy: 0,
                previous: 0,
                kick: 0
            }));

        return data;
    });

ready.catch(() => {});

function resize()
{
    w = innerWidth;
    h = innerHeight;

    const ratio = Math.min(devicePixelRatio || 1, 1.5);

    canvas.width = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

addEventListener('resize', resize);
resize();

function field(x, y, radius, hue, alpha, white = false, sx = 1, sy = 1)
{
    if (alpha < 0.001)
    {
        return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    const color = white ? '0,0%,95%' : `${hue},85%,58%`;

    gradient.addColorStop(0, `hsla(${color},${alpha})`);
    gradient.addColorStop(0.18, `hsla(${color},${alpha * 0.78})`);
    gradient.addColorStop(0.48, `hsla(${color},${alpha * 0.14})`);
    gradient.addColorStop(1, `hsla(${color},0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
}

function random(seed)
{
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
}

function bounce(value)
{
    const folded = ((value % 2) + 2) % 2;
    return folded > 1 ? 2 - folded : folded;
}

function beam(x1, y1, x2, y2, hue, intensity, width)
{
    ctx.save();
    ctx.lineCap = 'round';

    for (const [size, alpha] of [[10, 0.07], [4, 0.2], [1, 0.85]])
    {
        ctx.strokeStyle = `hsla(${hue},100%,65%,${intensity * alpha})`;
        ctx.lineWidth = width * size;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    ctx.strokeStyle = `hsla(${hue},80%,93%,${intensity * 0.8})`;
    ctx.lineWidth = Math.max(0.6, width * 0.28);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function lasers(stem, time, energy, quiet)
{
    const speed = quiet ? 0.3 : 1;
    const motion = time * speed;
    const count = stem.type === 'streak' ? 6 : 4;

    for (let j = 0; j < count; j++)
    {
        const seed = stem.seed + j * 8.71;
        const cycle = motion * (0.65 + random(seed) * 0.5) + random(seed + 2);
        const progress = cycle - Math.floor(cycle);
        const sweep = bounce(motion * 0.43 + random(seed + 3));
        const intensity = Math.min(0.9, energy * 0.8 + stem.kick * 0.16)
            * (quiet ? 0.38 : 1);
        const envelope = Math.pow(Math.sin(progress * Math.PI), 0.55);
        const length = (0.15 + energy * 0.22) * h;
        const y = progress * (h + length) - length * 0.5;

        if (stem.type === 'streak')
        {
            const side = j % 2 === 0 ? 1 : -1;
            const x = side === 1
                ? w * (0.025 + sweep * 0.14)
                : w * (0.975 - sweep * 0.14);
            const slant = (random(seed + 4) - 0.5) * w * 0.08;

            beam(
                x, y - length * 0.5,
                x + slant, y + length * 0.5,
                stem.h, intensity * envelope, 1.4 + energy * 1.8
            );

            const edgeY = (j % 2 === 0 ? 0.12 : 0.88) * h;
            const edgeX = progress * (w + w * 0.2) - w * 0.1;

            beam(
                edgeX - w * 0.09, edgeY,
                edgeX + w * 0.09, edgeY + (random(seed + 6) - 0.5) * h * 0.03,
                stem.h, intensity * envelope * 0.65, 1.2
            );
        }
        else
        {
            const x = bounce(motion * 0.37 + random(seed + 5)) * w;
            const diagonal = (j % 2 === 0 ? 1 : -1) * length * 0.7;

            beam(
                x - diagonal * 0.5, y - length * 0.5,
                x + diagonal * 0.5, y + length * 0.5,
                stem.h, intensity * envelope, 1.2 + energy * 2
            );
        }
    }
}

function particles(stem, time, energy, quiet)
{
    const sparks = stem.type === 'sparks';
    const motion = time * (quiet ? 0.2 : 1);
    const count = sparks ? 19 : 47;

    for (let j = 0; j < count; j++)
    {
        const seed = j * 17.37 + stem.seed;
        const direction = random(seed + 1) > 0.5 ? 1 : -1;
        const speed = 0.035 + random(seed + 2) * 0.13;

        const px = bounce(
            random(seed + 3)
            + motion * speed * direction
            + 0.10 * Math.sin(motion * (0.7 + random(seed + 4)) + seed)
            + 0.04 * Math.sin(motion * 2.13 + seed * 3)
        );

        const py = bounce(
            random(seed + 5)
            + motion * (0.04 + random(seed + 6) * 0.11)
                * (random(seed + 7) > 0.5 ? 1 : -1)
            + 0.13 * Math.sin(motion * (0.51 + random(seed + 8)) + seed * 2)
        );

        const life = 0.25 + 0.75
            * (0.5 + 0.5 * Math.sin(time * (0.8 + random(seed + 9) * 2.5) + seed));

        const radius = (sparks ? 0.7 : 1.2)
            + random(seed + 10) * (sparks ? 2 : 3.8)
            + energy * 1.8;

        const alpha = Math.min(0.95, energy * (0.4 + life * 0.65))
            * (quiet ? 0.5 : 1);

        const x = radius + px * (w - radius * 2);
        const y = radius + py * (h - radius * 2);

        field(x, y, radius * 3.5, stem.h, alpha * 0.28);

        ctx.fillStyle = `hsla(${stem.h},95%,${65 + random(seed + 11) * 20}%,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function draw(now)
{
    if (!active)
    {
        return;
    }

    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'screen';

    const time = audio.currentTime;
    const quiet = gentle.checked;
    const movement = quiet ? 0.23 : 1;
    const position = time * data.fps;

    for (const stem of data.tracks)
    {
        const index = Math.floor(position);
        const fraction = position - index;
        const raw = (stem.levels[index] || 0) * (1 - fraction)
            + (stem.levels[index + 1] || 0) * fraction;

        stem.energy += (raw - stem.energy)
            * (1 - Math.exp(-dt * (raw > stem.energy ? 19 : 6)));

        stem.kick = Math.max(
            stem.kick * Math.exp(-dt * 5),
            Math.max(0, raw - stem.previous) * 2
        );

        stem.previous = raw;

        const energy = stem.energy;

        if (energy < 0.004)
        {
            continue;
        }

        const phase = time * movement;
        const x = w * (
            0.5 + 0.34 * Math.sin(phase * 0.19 + stem.seed)
            + 0.09 * Math.sin(phase * 0.51 + stem.seed * 2)
        );
        const y = h * (0.48 + 0.32 * Math.cos(phase * 0.16 + stem.seed * 1.7));
        const hue = stem.change ? (time * 12 + raw * 60) % 360 : stem.h;

        let radius = Math.min(w, h) * (0.16 + energy * 0.22);
        const alpha = Math.min(0.4, energy * 0.3) * (quiet ? 0.6 : 1);

        if (stem.type === 'dots' || stem.type === 'sparks')
        {
            particles(stem, time, energy, quiet);
            continue;
        }

        if (stem.type === 'streak' || stem.type === 'laser')
        {
            lasers(stem, time, energy, quiet);
            continue;
        }

        if (stem.type === 'boom')
        {
            field(
                x, y, radius * (1 + stem.kick * 0.6),
                hue, Math.min(0.28, alpha * 0.7 + stem.kick * 0.12),
                true, 1.4, 0.9
            );
            continue;
        }

        if (stem.type === 'breath')
        {
            field(x, y, radius * 1.8, hue, alpha * 0.19, false, 1.6, 1.1);
            continue;
        }

        if (stem.type === 'bass')
        {
            field(
                x, h * (0.64 + 0.23 * Math.sin(phase * 0.14 + stem.seed)),
                radius * 1.4, hue, alpha * 0.75, false, 1.5, 0.65
            );
            continue;
        }

        if (stem.type === 'drum' || stem.type === 'pulse')
        {
            radius *= 1 + Math.min(stem.kick, 0.6) * (quiet ? 0.2 : 1);
        }

        for (let j = 0; j < 3; j++)
        {
            field(
                x + Math.sin(phase * 0.7 + stem.seed + j * 2) * radius * 0.3,
                y + Math.cos(phase * 0.6 + j + stem.seed) * radius * 0.3,
                radius * (0.85 + j * 0.12),
                hue + j * 5,
                alpha / (1.8 + j * 0.3),
                false, 1.2, 1
            );
        }
    }

    ctx.globalCompositeOperation = 'source-over';
    seek.value = time;
    document.querySelector('#time').textContent =
        `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

    frame = requestAnimationFrame(draw);
}

async function enter()
{
    const token = ++session;
    clearTimeout(fadeTimer);
    start.disabled = true;
    document.querySelector('#status').textContent = 'Loading music…';

    try
    {
        await ready;

        if (token !== session)
        {
            return;
        }

        seek.max = data.duration;
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
            'Could not load the music. Serve this folder through your website or a local web server.';
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

    document.querySelector('#status').textContent = 'Could not load young-turks.mp3.';
});

seek.addEventListener('input', () =>
{
    audio.currentTime = Number(seek.value);

    for (const stem of data.tracks)
    {
        stem.energy = 0;
        stem.previous = 0;
        stem.kick = 0;
    }
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

    if (event.code === 'Space'
        && !['INPUT', 'BUTTON'].includes(event.target.tagName))
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