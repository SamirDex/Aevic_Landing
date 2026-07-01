type MapSvgProps = {
  titleId: string;
};

export function MiramarMap({ titleId }: MapSvgProps) {
  return (
    <svg className="map-svg map-svg--miramar" viewBox="0 0 440 300" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Miramar abstract tournament map</title>
      <defs>
        <linearGradient id="miramarTerrain" x1="60" y1="45" x2="360" y2="270" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--map-light)" />
          <stop offset="0.45" stopColor="var(--map-mid)" />
          <stop offset="1" stopColor="var(--map-deep)" />
        </linearGradient>
      </defs>
      <path
        className="map-region"
        d="M42 119 91 58 171 35 252 51 326 32 394 92 377 161 412 214 348 272 264 252 208 283 128 252 84 204 29 184Z"
      />
      <polygon className="map-facet map-facet--bright" points="42 119 91 58 118 125 84 204" />
      <polygon className="map-facet" points="91 58 171 35 181 101 118 125" />
      <polygon className="map-facet map-facet--dim" points="171 35 252 51 237 113 181 101" />
      <polygon className="map-facet" points="252 51 326 32 318 115 237 113" />
      <polygon className="map-facet map-facet--bright" points="326 32 394 92 377 161 318 115" />
      <polygon className="map-facet" points="84 204 118 125 178 157 154 232 128 252" />
      <polygon className="map-facet map-facet--bright" points="118 125 181 101 237 113 178 157" />
      <polygon className="map-facet map-facet--dim" points="178 157 237 113 300 170 227 215" />
      <polygon className="map-facet" points="237 113 318 115 377 161 300 170" />
      <polygon className="map-facet map-facet--bright" points="300 170 377 161 412 214 348 272" />
      <polygon className="map-facet" points="154 232 178 157 227 215 208 283" />
      <polygon className="map-facet map-facet--dim" points="227 215 300 170 348 272 264 252" />
      <polygon className="map-facet map-facet--bright" points="208 283 227 215 264 252" />
      <path className="map-grid-line" d="M84 204 178 157 300 170 377 161" />
      <path className="map-grid-line" d="M118 125 181 101 237 113 318 115" />
      <path className="map-grid-line" d="M154 232 227 215 348 272" />
      <path className="map-route-line" d="M69 169 C111 137 154 119 204 124 S282 137 356 103" />
      <path className="map-route-line" d="M122 236 C162 209 206 198 246 211 S312 244 358 230" />
      <path className="map-route-line" d="M180 51 C199 92 201 130 178 157 S158 218 208 283" />
      <path className="map-route-line" d="M315 56 C300 99 302 137 318 164 S323 226 264 252" />
      <circle className="map-node" cx="204" cy="124" r="4" />
      <circle className="map-node" cx="246" cy="211" r="4" />
      <circle className="map-node" cx="318" cy="164" r="4" />
    </svg>
  );
}
