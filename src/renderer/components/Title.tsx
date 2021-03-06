import * as React from 'react';

type Props = {
  // projectName: string;
};

const Title: React.FC<Props> = props => (
  <>
    <div className="title">
      <svg
        className="logo"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 628 510"
      >
        <defs>
          <linearGradient
            id="linear-gradient"
            x1="147.16"
            y1="502.93"
            x2="553.4"
            y2="162.05"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#ff1d25" />
            <stop offset="0.25" stopColor="#ff931e" />
            <stop offset="0.5" stopColor="#7ac943" />
            <stop offset="0.75" stopColor="#3fa9f5" />
            <stop offset="1" stopColor="#ff7bac" />
          </linearGradient>
        </defs>
        <title>Nautilus Logo</title>
        <g className="cls-1">
          <g id="Layer_13" data-name="Layer 13">
            <image className="cls-2" width="628" height="510" />
            <path
              className="cls-3"
              d="M619.94,253c-91.77,11.91-130.69,44.59-148.84,74.13-30.8,50.14-4.61,95.9-45.09,142-37.71,42.94-96.9,44.73-107,44.87-8.29.11-67.33-1-111.21-44.87A154.26,154.26,0,1,1,426,251m42.5-42.5c-83.72-83.72-219.45-83.72-303.17,0s-83.72,219.45,0,303.17C221.06,567.35,293.48,573.58,307,574.2c7,0.32,101.36,3.25,161.54-62.56,44.1-48.23,27.57-87.13,73.16-141,33.43-39.52,76.24-58.7,107.3-68.74m-265.46-8.4A94.15,94.15,0,1,0,250.36,426.64c28.17,28.17,66.52,27.67,70.67,27.49,33.62-1.5,55.88-21.13,62.48-27.49,35.22-33.94,22-73.38,41.33-116C438.71,280,471,244.13,551.2,219.69M342.77,334.22a36.54,36.54,0,1,0,0,51.68A36.54,36.54,0,0,0,342.77,334.22Z"
              transform="translate(-65.6 -108.6)"
            />
          </g>
        </g>
      </svg>
      <h1>Nautilus</h1>
    </div>
  </>
);

export default Title;
