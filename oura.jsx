
import { run } from 'uebersicht';

const OURA_USER_COOKIE = 'YOUR_COOKIE_VALUE';

const api = {
  getOuraDailyData: async () => {
    const value = await run(`curl -s --location --request GET 'https://cloud.ouraring.com/api/account/daily-data' --header "Cookie: ${OURA_USER_COOKIE}"`);
    const data = JSON.parse(value);

    return transform(data.sleeps);

    function transform(data){
      data = data.slice().sort((a, b) => new Date(a.day) - new Date(b.day));
  
      const result = {};
      data.forEach(item => {
          Object.keys(item).forEach(key => {
              if (!result[key]) {
                  result[key] = [];
              }
              result[key].push(item[key]);
          });
      });
      return result;
    }
  },
};

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
export const refreshFrequency = 2 * hour;

export const command = async () => {
  return await api.getOuraDailyData();
};

// https://emotion.sh/
export const className =`
  top: 30px;
  left: 100px;
  box-sizing: border-box;
  margin: auto;
  padding: 20px;
  background-color: #0A1A2F;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  color: #3E87DF;
  font-family: Helvetica Neue;
  font-weight: 300;
  border-radius: 10px;
  text-align: justify;
  line-height: 1.5;

  h1 {
    font-size: 20px;
    margin: 16px 0 8px;
  }

  em {
    font-weight: 400;
    font-style: normal;
  }

  svg {
    border-radius: 3px;
  }
`;

export const render = ({ output, error }) => {
  if (error) {
    return <div>Error: {error}</div>;
  }
  console.log({ output, error });

  const { xAxisValues, data } = getChartData(output);
  console.log(data);

  const sleepDebt = getSleepDebt(output);
  return (
    <div>
      <Chart xAxisValues={xAxisValues} yAxisValues={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]} maximumYValue={11} data={data} />
      <div style={{ fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr auto' }}>
        <div>{sleepDebt ? 'Sleep debt: ' + sleepDebt : ''}</div>
        <div />
        <div>Update: {formatCurrentTime()}</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ------------------------------------------------------
// -------------------- Parsing data --------------------
// ------------------------------------------------------
// ------------------------------------------------------

function getDate(backFromToday) {
  const today = new Date().getDate();
  const date = new Date();
  date.setDate(today - backFromToday);
  return date.toISOString().split('T')[0];
}

function getLast15Days() {
  const dates = [];
  for (let i = -1; i < 14; i++) {
    dates.unshift(getDate(i)); // Format as YYYY-MM-DD
  }
  return dates;
}

function getSleepDebt(data) {
  const today = getDate(0);
  const yesterday = getDate(-1);
  const index = data.day.indexOf(today) || data.day.indexOf(yesterday);
  if (index === -1) {
    return null;
  }
  const sleepDuration = calculateSleepDuration(data.bedtime_start[index], data.bedtime_end[index]);
  if (sleepDuration > 8.5) {
    return;
  }
  return (8.5 - sleepDuration).toFixed(2);
}

function getChartData(data) {
  const last15Days = getLast15Days();
  const xAxisValues = [];
  const sleepDurations = [];
  const deepSleepDurations = [];
  const readiness = [];

  last15Days.forEach((day, i) => {
    xAxisValues.push(new Date(day).getDate());
    const index = data.day.indexOf(day);
    if (index !== -1) {
      const sleepDuration = calculateSleepDuration(data.bedtime_start[index], data.bedtime_end[index]);
      sleepDurations.push(sleepDuration);
      deepSleepDurations.push((data.deep_sleep_duration[index] / 1000));
      readiness.push(data.readiness[index].score / 10);
    } else {
      sleepDurations.push(0);
      deepSleepDurations.push(0);
      readiness.push(0);
    }
  });

  return {
    xAxisValues,
    data: [{
      stroke: '#3E87DF', values: deepSleepDurations, fill: 'url(#gradient)',
    }, {
      stroke: 'rgba(0, 255, 0, 0.5)', values: readiness,
    }, {
      stroke: 'red', values: sleepDurations, strokeWidth: 2
    }]
  };
}

function calculateSleepDuration(start, end) {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
}

function formatCurrentTime() {
  // Step 1: Create a Date object
  let now = new Date();
  
  // Step 2: Extract the hours and minutes
  let hours = now.getHours();
  let minutes = now.getMinutes();
  
  // Step 3: Ensure hours and minutes are two digits
  if (hours < 10) {
      hours = '0' + hours;
  }
  if (minutes < 10) {
      minutes = '0' + minutes;
  }
  
  // Step 4: Return the formatted time string
  return hours + ':' + minutes;
}

// -----------------------------------------------
// -----------------------------------------------
// -------------------- Chart --------------------
// -----------------------------------------------
// -----------------------------------------------

// Improved utility function to generate the path data string for SVG using Catmull-Rom to Bezier
const catmullRom2Bezier = (points, alpha = 0.3) => {
  let d = "";

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6 * alpha;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * alpha;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * alpha;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * alpha;

    if (i === 0) {
      d += `M${p1.x},${p1.y} `;
    }

    d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y} `;
  }

  return d;
};

// Utility function to map value to SVG coordinates
const scaleValue = (value, maxValue, size) => (value / maxValue) * size;

// Chart component
function Chart({ xAxisValues, yAxisValues, maximumYValue, data }) {
  const width = 800;
  const height = 500;
  const padding = 50;
  
  if (!maximumYValue) {
    maximumYValue = Math.max(...data.flatMap(d => d.values));
  }
  const xScale = (index) => padding + scaleValue(index, xAxisValues.length - 1, width - 2 * padding);
  const yScale = (value) => height - padding - scaleValue(value, maximumYValue, height - 2 * padding);

  const getPoints = (values) => values.map((value, index) => ({ x: xScale(index), y: yScale(value) }));

  return (
    <svg width={width} height={height} style={{ fontFamily: 'Arial, sans-serif' }}>
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#3E87DF" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#0A1A2F" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" fill="#0A1A2F" />
      {yAxisValues.filter((a, i) => i % 2 === 1).map((value, index) => (
        <text
          key={index}
          x={xScale(0) - 10}
          y={yScale(index * 2 + 2)}
          textAnchor="middle"
          fontSize="12"
          fill="white"
        >{value}</text>
      ))}
      <g stroke="#1A2B44" stroke-width="1">
        {yAxisValues.map((value, index) => (
          <line
            key={index}
            x1={xScale(0)}
            x2={xScale(14)}
            y1={yScale(index + 1)}
            y2={yScale(index + 1)}
          />
        ))}
      </g>

      {data.filter(x => x.fill).map((dataset, i) => (
        <polygon
          key={i}
          points={getPoints(dataset.values).map(({ x, y }) => `${x},${y}`).join(' ')}
          fill={dataset.fill}
        />
      ))}

      {data.map((dataset, i) => (
        <path
          key={i}
          d={catmullRom2Bezier(getPoints(dataset.values), dataset.fill ? 0 : 0.3)}
          fill="none"
          stroke={dataset.stroke}
          strokeWidth={dataset.strokeWidth || 1}
          style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.2))' }}
        />
      ))}

      {xAxisValues.map((value, index) => (
        <text
          key={index}
          x={xScale(index)}
          y={height - padding / 2}
          textAnchor="middle"
          fontSize="12"
          fill="white"
        >
          {value}
        </text>
      ))}
    </svg>
  );
}
