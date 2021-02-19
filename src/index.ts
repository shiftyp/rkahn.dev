import {
  Component,
  html,
  svg,
  render,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "uland";

type AstronautData = {
  id: number;
  color: string;
  power: string;
};

const randNum = () => Math.trunc(Math.random() * 10) / 10;
const randPercent = () => `${randNum() * 100}%`;
const randRotation = () => `${randNum() * 720}deg`;
const randTime = () => `${1000 + randNum() * 4000}ms`;

const Astronaut = Component(({ color, power }: AstronautData) => {
  const [[x, y], updatePosition] = useState(["50%", "135px"]);

  const move = () => {
    let newX: string, newY: string;

    do {
      newX = randPercent();
      newY = randPercent();
    } while (x == newX && y == newY);

    updatePosition([newX, newY]);
  };

  useEffect(() => {
    setTimeout(move, 500);
  }, []);

  return html`
    <div
      class="user-astronaut"
      style=${`
        color: ${color};
        left: ${x};
        top: ${y};
        transform: rotate(${randRotation()});
        transition-duration: ${randTime()};
      `}
      ontransitionend=${move}
    >
      <svg
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="-74 0 572 572.35609"
      >
        ${svg`
        <text class="power" text-anchor="middle" x="180">
          ${power}
          <animate attributeName="y" dur="800ms" from="500" to="1200" repeatCount="indefinite" />
          <animate attributeName="opacity" dur="800ms" from="1" to="0.2" repeatCount="indefinite" />
        </text>
        <use xlink:href="#astronaut" />
        `}
      </svg>
    </div>
  `;
});

const Astronauts = Component((ref: HTMLElement) => {
  const fetching = useRef<boolean>(false);
  const fetchTimeout = useRef<number>(null);
  const updateTimeout = useRef<number>(null);
  const [color, setColor] = useState<string>("#D0D7DF");
  const [power, setPower] = useState<string>("💥");
  const astronautsIndex = useRef<Record<string, null>>({});
  const [astronauts, setAstronauts] = useState<AstronautData[]>([]);
  const [open, setOpen] = useState<boolean>(false);

  const openHatch = useMemo(
    () => () => {
      setOpen(true);
      setTimeout(() => setOpen(false), 3000);
    },
    []
  );

  const updateAstronauts = (nextAstronauts: AstronautData[]) => {
    astronautsIndex.current = {};

    for (const { id } of nextAstronauts) {
      astronautsIndex.current[id] = null;
    }

    setAstronauts(nextAstronauts);
  };

  const fetchAstronauts = useMemo(
    () => async (doOpen = true) => {
      if (fetching.current) {
        return;
      }
      fetching.current = true;
      const resp = await fetch(`/astronauts`);
      const nextAstronauts = await resp.json();
      if (
        nextAstronauts.length !== Object.keys(astronautsIndex.current).length ||
        nextAstronauts.some(
          (astro) => !astronautsIndex.current.hasOwnProperty(astro.id)
        )
      ) {
        if (doOpen) {
          openHatch();
        }

        if (updateTimeout.current !== null) {
          clearTimeout(updateTimeout.current);
        }
        updateTimeout.current = setTimeout(() => {
          updateAstronauts(nextAstronauts);
        }, 500);
      }

      fetching.current = false;

      if (fetchTimeout.current !== null) {
        clearTimeout(fetchTimeout.current);
      }
      fetchTimeout.current = setTimeout(fetchAstronauts, 10000);
    },
    []
  );

  useEffect(() => {
    fetchAstronauts();
  }, []);

  const addAstronaut = async () => {
    const astronaut = {
      color,
      power,
    };

    // @ts-ignore
    analytics.track("Astronaut Launched", astronaut);

    await fetch("/astronauts", {
      method: "POST",
      body: JSON.stringify(astronaut),
    });

    await fetchAstronauts();
  };

  return html`
    ${astronauts.map((astronaut) => {
      // @ts-ignore
      return html.for(ref, astronaut.id)`<div data-id=${astronaut.id}>${Astronaut(astronaut)}</div>`;
    })}
    <form
      height="100%"
      onSubmit=${(e) => {
        e.preventDefault();
        if (!open) addAstronaut();
      }}
    >
      <label for="color">Pick a color =&gt;</label>
      <div class="astronaut-controls">
        <input
          id="color"
          value=${color}
          type="color"
          onchange=${(e) => setColor(e.target.value)}
        />
        <button .disabled=${open}>Launch Astronaut</button>
        <select
          id="power"
          value=${power}
          onchange=${(e) => setPower(e.target.value)}
        >
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
  `;
});

const container = document.getElementById("astronauts");

render(container, Astronauts(container));
