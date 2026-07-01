type MapSvgProps = {
  titleId: string;
};

export function RondoMap({ titleId }: MapSvgProps) {
  return (
    <svg className="map-svg map-svg--rondo" viewBox="0 0 400 300" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Rondo abstract tournament map</title>
      <defs>
        <linearGradient id="rondoTerrain" x1="64" y1="36" x2="318" y2="264" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--map-light)" />
          <stop offset="0.5" stopColor="var(--map-mid)" />
          <stop offset="1" stopColor="var(--map-deep)" />
        </linearGradient>
      </defs>
      <path
        className="map-region"
        d="M57 85 129 38 205 47 266 29 342 85 367 154 319 221 257 247 190 273 113 244 61 187 34 124Z"
      />
      <path className="map-island" d="M265 187 318 185 347 214 313 243 260 228 240 206Z" />
      <polygon className="map-facet" points="57 85 129 38 143 103 91 141" />
      <polygon className="map-facet map-facet--bright" points="129 38 205 47 192 120 143 103" />
      <polygon className="map-facet" points="205 47 266 29 285 95 192 120" />
      <polygon className="map-facet map-facet--dim" points="266 29 342 85 314 136 285 95" />
      <polygon className="map-facet map-facet--bright" points="91 141 143 103 192 120 172 179 99 189" />
      <polygon className="map-facet" points="192 120 285 95 269 171 172 179" />
      <polygon className="map-facet map-facet--dim" points="285 95 314 136 367 154 319 221 269 171" />
      <polygon className="map-facet" points="99 189 172 179 190 273 113 244" />
      <polygon className="map-facet map-facet--bright" points="172 179 269 171 257 247 190 273" />
      <polygon className="map-facet" points="269 171 319 221 257 247" />
      <polygon className="map-facet map-facet--dim" points="240 206 265 187 318 185 313 243 260 228" />
      <path className="map-grid-line" d="M91 141 172 179 269 171 319 221" />
      <path className="map-grid-line" d="M143 103 192 120 285 95 314 136" />
      <path className="map-grid-line" d="M190 273 257 247 313 243" />
      <path className="map-route-line" d="M77 128 C132 107 178 113 216 103 S287 83 338 123" />
      <path className="map-route-line" d="M92 205 C151 191 192 183 233 191 S288 208 335 214" />
      <path className="map-route-line" d="M201 57 C182 99 187 141 172 179 S166 232 190 273" />
      <path className="map-route-line" d="M284 67 C270 112 264 146 269 171 S284 210 257 247" />
      <circle className="map-node" cx="216" cy="103" r="4" />
      <circle className="map-node" cx="233" cy="191" r="4" />
      <circle className="map-node" cx="338" cy="123" r="4" />
    </svg>
  );
}
