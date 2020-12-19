import { render, h, Fragment } from 'preact';
import { useRef, useEffect, useState, useCallback, useMemo } from 'preact/hooks';

type AstronautData = {
    id: number,
    color: string;
    power: string;
}

const randNum = () => Math.trunc(Math.random() * 10) / 10;
const randPercent = () => `${randNum() * 100}%`;
const randRotation = () => `${randNum() * 720}deg`;
const randTime = () => `${1000 + randNum() * 4000}ms`;

const Astronaut = ({ id, color, power }: AstronautData) => {
    const [[x, y], updatePosition] = useState(['50%', '135px']);

    const move = () => {
        let newX: string, newY: string;

        do {
            newX = randPercent();
            newY = randPercent();
        } while(x == newX && y == newY)

        updatePosition([newX, newY]);
    };

    useEffect(() => {
        move();
    }, []);

    return (
        <div
            class="user-astronaut"
            style={{
                color,
                left: x,
                top: y,
                transform: `rotate(${randRotation()})`,
                transitionDuration: randTime(),
            }}
            onTransitionEnd={move}
        >
            <svg
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="-74 0 572 572.35609"
            >
                <text class="power" text-anchor="middle" x="180">
                    {power}
                    <animate
                        attributeName="y"
                        dur="800ms"
                        from="500"
                        to="1200"
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        dur="800ms"
                        from="1"
                        to="0.2"
                        repeatCount="indefinite"
                    />
                </text>
                <use xlinkHref="#astronaut" />
            </svg>
        </div >
    );
}

const Astronauts = () => {
    const slowFrameCount = useRef<number>(0);
    const astronautCount = useRef<number>(50);
    const lastFrameTiming = useRef<number | null>(null)
    const fetchTimeout = useRef<number | null>(null);
    const updateTimeout = useRef<number | null>(null);
    const color = useRef<HTMLInputElement>();
    const power = useRef<HTMLSelectElement>();
    const astronautsIndex = useRef<Record<string, null>>({})
    const [astronauts, setAstronauts] = useState<AstronautData[]>([]);
    const [open, setOpen] = useState(false);

    const openHatch = useMemo(() => () => {
        setOpen(true);
        setTimeout(() => setOpen(false), 2800);
    }, []);

    const fetchAstronauts = useMemo(() => async (doOpen = true) => {
        const resp = await fetch(`/astronauts?count=${astronautCount.current}`);
        const nextAstronauts = await resp.json();
        if (nextAstronauts.length !== Object.keys(astronautsIndex.current).length || nextAstronauts.some((astro) => !astronautsIndex.current.hasOwnProperty(astro.id))) {
            if (doOpen) {
                openHatch();
            }

            if (updateTimeout.current !== null) {
                clearTimeout(updateTimeout.current);
            }
            updateTimeout.current = setTimeout(() => {
                astronautsIndex.current = {};

                for (const { id } of nextAstronauts) {
                    astronautsIndex.current[id] = null;
                }
                setAstronauts(nextAstronauts)
            }, 500);
        }
        if (fetchTimeout.current !== null) {
            clearTimeout(fetchTimeout.current);
        }

        fetchTimeout.current = setTimeout(fetchAstronauts, 10000);
    }, []);

    const measureFramerate = useMemo(() => () => {
        const maximumFrameTime = 1000 / 30; // 30 FPS
        const t = performance.now();
        if (lastFrameTiming.current !== null) {
            const elapsed = t - lastFrameTiming.current;
            const slow = elapsed < maximumFrameTime;

            if (slow && slowFrameCount.current > 10) {
                astronautCount.current--;
                slowFrameCount.current = 0;
                fetchAstronauts(false);
            } else if (slow) {
                slowFrameCount.current++;
            }
        }
        lastFrameTiming.current = t;
        requestAnimationFrame(measureFramerate);
    }, []);

    useEffect(() => {
        fetchAstronauts();
        requestAnimationFrame(measureFramerate)
    }, []);

    const addAstronaut = async () => {
        const astronaut = {
            color: color.current.value,
            power: power.current.value,
        };

        // @ts-ignore
        analytics.track('Astronaut Launched', astronaut);

        await fetch('/astronauts', {
            method: 'POST',
            body: JSON.stringify(astronaut),
        })

        await fetchAstronauts();
    }

    return (
        <>
            {astronauts.map(astronaut => <Astronaut key={astronaut.id} {...astronaut} />)}
            <form height="100%" onSubmit={(e) => {
                e.preventDefault();
                if (!open) addAstronaut();
            }}>
                <label for="color">Pick a color =&gt;</label>
                <div class="astronaut-controls">
                    <input id="color" defaultValue="#D0D7DF" type="color" ref={color} />
                    <button disabled={open}>Launch Astronaut</button>
                    <select id="power" ref={power}>
                        <option value="💥">💥</option>
                        <option value="💖">💖</option>
                        <option value="💧">💧</option>
                        <option value="🔥">🔥</option>
                        <option value="⭐">⭐</option>
                        <option value="💎">💎</option>
                    </select>
                </div>
                <label for="power">&lt;= Pick a power</label>
            </form>
        </>
    );
}

render(<Astronauts />, document.getElementById('astronauts'));

