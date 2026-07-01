type MapSvgProps = {
  titleId: string;
};

export function ErangelMap({ titleId }: MapSvgProps) {
  return (
    <svg className="map-svg map-svg--erangel" viewBox="0 0 420 300" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Erangel abstract tournament map</title>
      <defs>
        <linearGradient id="erangelTerrain" x1="68" y1="30" x2="346" y2="270" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--map-light)" />
          <stop offset="0.48" stopColor="var(--map-mid)" />
          <stop offset="1" stopColor="var(--map-deep)" />
        </linearGradient>
      </defs>
      <path
        className="map-region"
        d="M69 71 118 39 181 50 230 27 306 58 353 111 342 175 375 230 313 263 236 244 185 276 110 241 81 188 45 144Z"
      />
      <path className="map-island" d="M241 205 292 202 326 230 291 256 237 243 216 221Z" />
      <polygon className="map-facet" points="69 71 118 39 135 102 87 132" />
      <polygon className="map-facet map-facet--bright" points="118 39 181 50 171 113 135 102" />
      <polygon className="map-facet" points="181 50 230 27 254 93 171 113" />
      <polygon className="map-facet map-facet--dim" points="230 27 306 58 282 118 254 93" />
      <polygon className="map-facet" points="306 58 353 111 306 142 282 118" />
      <polygon className="map-facet map-facet--bright" points="87 132 135 102 171 113 156 169 104 178" />
      <polygon className="map-facet" points="171 113 254 93 242 160 156 169" />
      <polygon className="map-facet map-facet--dim" points="254 93 306 142 273 184 242 160" />
      <polygon className="map-facet" points="306 142 342 175 326 230 273 184" />
      <polygon className="map-facet map-facet--bright" points="104 178 156 169 185 276 110 241" />
      <polygon className="map-facet" points="156 169 242 160 236 244 185 276" />
      <polygon className="map-facet map-facet--dim" points="242 160 273 184 236 244" />
      <polygon className="map-facet map-facet--bright" points="216 221 241 205 292 202 291 256 237 243" />
      <path className="map-grid-line" d="M87 132 156 169 242 160 306 142" />
      <path className="map-grid-line" d="M135 102 171 113 254 93 282 118" />
      <path className="map-grid-line" d="M185 276 236 244 291 256" />
      <path className="map-route-line" d="M80 139 C124 122 145 129 176 116 S246 96 304 130" />
      <path className="map-route-line" d="M112 218 C147 196 177 180 224 183 S285 198 330 224" />
      <path className="map-route-line" d="M155 64 C175 102 177 139 161 171 S167 227 196 259" />
      <path className="map-route-line" d="M245 58 C226 95 224 136 242 160 S261 202 237 243" />
      <circle className="map-node" cx="176" cy="116" r="4" />
      <circle className="map-node" cx="224" cy="183" r="4" />
      <circle className="map-node" cx="304" cy="130" r="4" />
    </svg>
  );
}
