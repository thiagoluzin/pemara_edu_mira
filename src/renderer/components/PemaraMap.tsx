/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA COMPONENTE DE MAPA DIDÁTICO DETERMINÍSTICO (Layout: 07_map)
 * Visualização territorial e espacial do Mar Egeu, Grécia Antiga e pontos focais
 */

import React, { useState } from 'react';
import { MapScene, MapFocusPoint } from '../../types/lesson';
import { MapPin, Compass, Navigation, Info, Eye } from 'lucide-react';

interface Props {
  scene: MapScene;
}

export const PemaraMap: React.FC<Props> = ({ scene }) => {
  const { region_name, focus_points, historical_notes } = scene.params;
  const [selectedPoint, setSelectedPoint] = useState<MapFocusPoint | null>(focus_points[0] || null);

  // Projeção cartográfica determinística didática (Mar Egeu)
  // Lat: 36 a 41, Lon: 20 a 28
  const svgWidth = 840;
  const svgHeight = 440;
  const minLon = 20.0;
  const maxLon = 27.5;
  const minLat = 36.0;
  const maxLat = 40.5;

  const toSvgX = (lon: number) => {
    return ((lon - minLon) / (maxLon - minLon)) * (svgWidth - 160) + 80;
  };

  const toSvgY = (lat: number) => {
    // Invertido: maior latitude fica no topo
    return ((maxLat - lat) / (maxLat - minLat)) * (svgHeight - 120) + 60;
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400" />
            Recurso Cartográfico • {region_name}
          </div>
          <h3 className="text-2xl font-black text-white">{scene.title}</h3>
        </div>

        {scene.source_citation && (
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
            Fonte: {scene.source_citation}
          </span>
        )}
      </div>

      {/* ÁREA DO MAPA EM SVG VETORIAL */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#0b192c] via-[#091b33] to-[#071326] border border-cyan-950/60 overflow-hidden shadow-inner flex flex-col md:flex-row items-stretch">
        {/* SVG Territorial */}
        <div className="flex-1 relative p-4 flex items-center justify-center min-h-[380px]">
          {/* Rosa dos Ventos / Indicador Norte */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-cyan-300 font-mono">
            <Navigation className="w-3.5 h-3.5 rotate-45 text-cyan-400" />
            <span>Norte Geográfico</span>
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto max-h-[460px] select-none">
            <defs>
              <radialGradient id="aegean-sea" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f2942" />
                <stop offset="100%" stopColor="#081426" />
              </radialGradient>
              <linearGradient id="greece-land" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>

            {/* Mar Egeu Fundo */}
            <rect width={svgWidth} height={svgHeight} fill="url(#aegean-sea)" />

            {/* Grid de Coordenadas Náuticas sutis */}
            <g stroke="#162e4a" strokeWidth="1" strokeDasharray="4 4">
              <line x1="100" y1="0" x2="100" y2={svgHeight} />
              <line x1="300" y1="0" x2="300" y2={svgHeight} />
              <line x1="500" y1="0" x2="500" y2={svgHeight} />
              <line x1="700" y1="0" x2="700" y2={svgHeight} />
              <line x1="0" y1="100" x2={svgWidth} y2="100" />
              <line x1="0" y1="220" x2={svgWidth} y2="220" />
              <line x1="0" y1="340" x2={svgWidth} y2="340" />
            </g>

            {/* Silhueta Continental Esquematizada da Grécia e Peloponeso */}
            <path
              d="M 120 70 Q 240 60 320 110 T 360 210 Q 330 290 280 340 Q 230 380 200 320 T 160 260 Q 110 210 130 140 Z"
              fill="url(#greece-land)"
              stroke="#334155"
              strokeWidth="2"
            />
            {/* Peloponeso */}
            <path
              d="M 230 250 Q 300 240 330 280 T 300 360 Q 240 370 210 320 Z"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Ilhas Cíclades e Creta */}
            <ellipse cx="440" cy="290" rx="35" ry="15" fill="#1e293b" stroke="#334155" />
            <ellipse cx="510" cy="270" rx="20" ry="12" fill="#1e293b" stroke="#334155" />
            <ellipse cx="420" cy="410" rx="120" ry="18" fill="#1e293b" stroke="#334155" />
            <text x="420" y="415" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">
              CRETA
            </text>

            <text x="500" y="160" fill="#38bdf8" opacity="0.3" fontSize="24" fontWeight="900" letterSpacing="4">
              MAR EGEU
            </text>
            <text x="140" y="380" fill="#38bdf8" opacity="0.3" fontSize="16" fontWeight="bold" letterSpacing="2">
              MAR JÔNICO
            </text>

            {/* PONTOS FOCAIS HISTÓRICOS */}
            {focus_points.map((pt) => {
              const cx = toSvgX(pt.lon);
              const cy = toSvgY(pt.lat);
              const isSelected = selectedPoint?.name === pt.name;

              return (
                <g
                  key={pt.name}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={() => setSelectedPoint(pt)}
                  className="cursor-pointer group"
                >
                  {/* Aura pulsante ao redor do ponto */}
                  <circle
                    r={isSelected ? 16 : 8}
                    fill={isSelected ? '#38bdf8' : '#e0f2fe'}
                    opacity={isSelected ? 0.35 : 0.15}
                    className={isSelected ? 'animate-ping' : ''}
                  />

                  {/* Marcador central */}
                  <circle
                    r={isSelected ? 7 : 5}
                    fill={isSelected ? '#38bdf8' : '#f59e0b'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-125"
                  />

                  {/* Nome da Pólis */}
                  <text
                    x="0"
                    y={-12}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={isSelected ? '13' : '11'}
                    fontWeight={isSelected ? 'bold' : '600'}
                    className="select-none drop-shadow-md"
                  >
                    {pt.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Ficha Lateral do Ponto Histórico Selecionado */}
        <div className="w-full md:w-80 p-5 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between text-xs space-y-4">
          {selectedPoint ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Pólis em Destaque</span>
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-white">{selectedPoint.name}</h4>
                <span className="text-slate-400 font-medium">{selectedPoint.region}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5">
                <span className="text-slate-400 block font-semibold">Papel Histórico Fundamental:</span>
                <p className="text-slate-200 text-xs leading-relaxed">{selectedPoint.role}</p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                <span>Lat: {selectedPoint.lat.toFixed(2)}°N</span>
                <span>Lon: {selectedPoint.lon.toFixed(2)}°E</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">
              Clique em um dos pontos no mapa para explorar a pólis.
            </div>
          )}

          {historical_notes && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>{historical_notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
