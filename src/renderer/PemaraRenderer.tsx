/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA RENDER ENGINE — O MOTOR PRINCIPAL DE RENDERIZAÇÃO
 * Recebe o `lesson.json` validado e renderiza qualquer tipo de cena com 60 FPS
 * Conforme Layouts Aprovados V1 (01_title a 11_summary)
 */

import React from 'react';
import { Scene } from '../types/lesson';
import { PemaraTitle } from './components/PemaraTitle';
import { PemaraText } from './components/PemaraText';
import { PemaraMap } from './components/PemaraMap';
import { PemaraComparison } from './components/PemaraComparison';
import { PemaraSummary } from './components/PemaraSummary';
import { PemaraProjectile } from './components/PemaraProjectile';
import { PemaraOrbit } from './components/PemaraOrbit';
import { PemaraFunctionGraph } from './components/PemaraFunctionGraph';
import { PemaraTimeline } from './components/PemaraTimeline';
import { PemaraQuiz } from './components/PemaraQuiz';

interface Props {
  scene: Scene;
  onSceneParamChange?: (updatedScene: Scene) => void;
}

export const PemaraRenderer: React.FC<Props> = ({ scene, onSceneParamChange }) => {
  if (!scene) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        Nenhuma cena carregada no renderizador.
      </div>
    );
  }

  switch (scene.type) {
    case 'title':
      return <PemaraTitle scene={scene} />;

    case 'text':
      return <PemaraText scene={scene} />;

    case 'map':
      return <PemaraMap scene={scene} />;

    case 'comparison':
      return <PemaraComparison scene={scene} />;

    case 'summary':
      return <PemaraSummary scene={scene} />;

    case 'physics_projectile':
      return (
        <PemaraProjectile
          scene={scene}
          onParamsChange={(newParams) => {
            if (onSceneParamChange) {
              onSceneParamChange({ ...scene, params: newParams });
            }
          }}
        />
      );

    case 'solar_system':
      return (
        <PemaraOrbit
          scene={scene}
          onParamsChange={(newParams) => {
            if (onSceneParamChange) {
              onSceneParamChange({ ...scene, params: newParams });
            }
          }}
        />
      );

    case 'math_function':
      return (
        <PemaraFunctionGraph
          scene={scene}
          onParamsChange={(newParams) => {
            if (onSceneParamChange) {
              onSceneParamChange({ ...scene, params: newParams });
            }
          }}
        />
      );

    case 'timeline':
      return <PemaraTimeline scene={scene} />;

    case 'quiz':
      return <PemaraQuiz scene={scene} />;

    default:
      return (
        <div className="p-8 text-center text-amber-400 bg-slate-900 rounded-2xl border border-amber-500/30">
          Tipo de cena não suportado: {(scene as any).type}
        </div>
      );
  }
};
