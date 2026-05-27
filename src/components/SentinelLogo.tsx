import React from 'react';

interface SentinelIconProps extends React.SVGProps<SVGSVGElement> {
  /** Tamaño del logo. Le metes los píxeles o rems que te dé la gana */
  size?: number | string;
  /** Usa currentColor para que agarre el color del texto de Tailwind (ej: text-blue-500) */
  color?: string;
}

export const SentinelIcon: React.FC<SentinelIconProps> = ({
  size = '100%',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      /* Caja encuadrada exactito en el escudo, sin rastro de las letras muertas */
      viewBox="550 120 310 380"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      {...props}
    >
      <g
        transform="translate(0, 768) scale(0.1, -0.1)"
        fill={color}
        stroke="none"
      >
        {/* Este es el único <path> que sobrevive: el Escudo de Águila */}
        <path d="M6805 6250 c-121 -43 -386 -137 -590 -208 -203 -72 -416 -147 -471 -167 l-101 -36 -1 -712 c-2 -841 4 -976 48 -1132 39 -139 129 -321 217 -440 73 -99 273 -303 369 -377 l61 -47 208 327 c707 1106 704 1102 778 1179 107 112 242 183 349 183 59 0 128 -29 157 -66 10 -13 22 -24 26 -24 4 0 6 44 3 98 -6 116 -33 187 -97 251 -51 51 -103 77 -191 97 -68 16 -69 16 -95 69 -31 65 -89 118 -164 154 l-56 26 -508 3 -508 3 20 -38 c33 -65 107 -146 170 -187 l60 -39 -97 -141 c-53 -78 -178 -259 -277 -403 -99 -145 -182 -263 -185 -263 -3 0 -4 288 -2 639 2 596 3 639 20 646 9 4 259 92 555 196 l538 188 552 -193 552 -194 0 -743 0 -744 -28 -88 c-56 -180 -162 -350 -310 -495 -52 -50 -99 -92 -104 -92 -10 0 -161 319 -329 693 -67 151 -91 194 -100 185 -6 -7 -145 -227 -309 -488 -164 -261 -342 -545 -396 -631 -54 -85 -101 -163 -104 -171 -5 -12 13 -31 68 -72 100 -74 246 -168 390 -251 l117 -68 83 48 c819 475 1179 853 1289 1356 23 104 23 105 22 933 l-1 830 -79 27 c-43 15 -279 98 -524 184 -552 194 -786 275 -797 274 -4 0 -107 -35 -228 -79z m453 -1090 c17 -11 32 -21 32 -24 0 -2 -28 -22 -63 -45 -49 -32 -73 -41 -106 -41 -38 0 -49 6 -102 57 -32 31 -59 60 -59 65 0 4 60 8 133 8 114 0 136 -3 165 -20z" />
      </g>
    </svg>
  );
};

export default SentinelIcon;