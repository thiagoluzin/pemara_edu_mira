/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA VALIDADOR DE SCHEMA v1.0
 * Garante que o renderer nunca receba um JSON corrompido ou inválido.
 */

import { LessonSpec, Scene } from '../types/lesson';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLessonSpec(spec: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec || typeof spec !== 'object') {
    return { isValid: false, errors: ['O documento deve ser um objeto JSON válido.'], warnings: [] };
  }

  // 1. Verificação de versão do schema
  if (!spec.schema_version) {
    errors.push('Campo obrigatório ausente: "schema_version".');
  } else if (spec.schema_version !== '1.0') {
    errors.push(`Versão de schema "${spec.schema_version}" incompatível com o renderizador (requer "1.0").`);
  }

  // 2. Metadados da Aula
  if (!spec.lesson || typeof spec.lesson !== 'object') {
    errors.push('Campo obrigatório ausente ou inválido: "lesson".');
  } else {
    const { id, subject, title, duration_minutes } = spec.lesson;
    if (!id || typeof id !== 'string') errors.push('lesson.id é obrigatório e deve ser uma string.');
    if (!subject || typeof subject !== 'string') errors.push('lesson.subject é obrigatório.');
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('lesson.title não pode estar vazio.');
    }
    if (typeof duration_minutes !== 'number' || duration_minutes <= 0 || duration_minutes > 300) {
      warnings.push('lesson.duration_minutes deve estar entre 1 e 300 minutos.');
    }
  }

  // 3. Objetivos pedagógicos
  if (!Array.isArray(spec.objectives)) {
    warnings.push('"objectives" deveria ser uma lista de objetivos de aprendizagem.');
  } else if (spec.objectives.length === 0) {
    warnings.push('Nenhum objetivo pedagógico listado na aula.');
  }

  // 4. Validação das Cenas
  if (!Array.isArray(spec.scenes)) {
    errors.push('"scenes" deve ser uma lista (array) de cenas.');
  } else if (spec.scenes.length === 0) {
    errors.push('A aula deve conter pelo menos 1 cena.');
  } else {
    const sceneIds = new Set<string>();

    spec.scenes.forEach((scene: Scene, index: number) => {
      const prefix = `Cena [${index + 1}]`;

      if (!scene || typeof scene !== 'object') {
        errors.push(`${prefix}: Estrutura de cena inválida.`);
        return;
      }

      if (!scene.id) {
        errors.push(`${prefix}: Campo "id" é obrigatório.`);
      } else if (sceneIds.has(scene.id)) {
        errors.push(`${prefix}: ID duplicado "${scene.id}". IDs de cenas devem ser únicos.`);
      } else {
        sceneIds.add(scene.id);
      }

      if (!scene.type) {
        errors.push(`${prefix}: Campo "type" é obrigatório.`);
        return;
      }

      // Validação por tipo de cena
      switch (scene.type) {
        case 'title':
          if (!scene.title || typeof scene.title !== 'string') {
            errors.push(`${prefix} (title): Título não pode estar vazio.`);
          }
          break;

        case 'text':
          if (!scene.title) errors.push(`${prefix} (text): Título é obrigatório.`);
          if (!scene.content || (!Array.isArray(scene.content) && typeof scene.content !== 'string')) {
            warnings.push(`${prefix} (text): "content" deve conter parágrafos de texto didático.`);
          }
          break;

        case 'map':
          if (!scene.title) errors.push(`${prefix} (map): Título é obrigatório.`);
          if (!scene.params || !Array.isArray(scene.params.focus_points)) {
            errors.push(`${prefix} (map): "params.focus_points" deve ser uma lista de marcos cartográficos.`);
          }
          break;

        case 'comparison':
          if (!scene.title) errors.push(`${prefix} (comparison): Título é obrigatório.`);
          if (!scene.params || !Array.isArray(scene.params.columns) || !Array.isArray(scene.params.rows)) {
            errors.push(`${prefix} (comparison): "columns" e "rows" são obrigatórios.`);
          }
          break;

        case 'summary':
          if (!scene.title) errors.push(`${prefix} (summary): Título é obrigatório.`);
          if (!Array.isArray(scene.takeaways) || scene.takeaways.length === 0) {
            errors.push(`${prefix} (summary): "takeaways" deve conter ao menos 1 ponto de síntese.`);
          }
          break;

        case 'physics_projectile': {
          const params = scene.params;
          if (!params) {
            errors.push(`${prefix} (physics_projectile): "params" é obrigatório.`);
          } else {
            if (typeof params.velocity !== 'number' || params.velocity <= 0 || params.velocity > 500) {
              errors.push(`${prefix}: Velocidade deve ser um número entre 1 e 500 m/s.`);
            }
            if (typeof params.angle !== 'number' || params.angle < 0 || params.angle > 90) {
              errors.push(`${prefix}: Ângulo deve ser entre 0° e 90°.`);
            }
            if (typeof params.gravity !== 'number' || params.gravity < 0 || params.gravity > 100) {
              errors.push(`${prefix}: Gravidade deve ser >= 0 e <= 100 m/s².`);
            }
          }
          break;
        }

        case 'solar_system': {
          const params = scene.params;
          if (!params) {
            errors.push(`${prefix} (solar_system): "params" é obrigatório.`);
          }
          break;
        }

        case 'math_function': {
          const params = scene.params;
          if (!params) {
            errors.push(`${prefix} (math_function): "params" é obrigatório.`);
          } else {
            if (typeof params.a !== 'number') {
              errors.push(`${prefix}: Coeficiente "a" deve ser um número.`);
            }
          }
          break;
        }

        case 'timeline': {
          const params = scene.params;
          if (!params || !Array.isArray(params.events) || params.events.length === 0) {
            errors.push(`${prefix} (timeline): Deve conter uma lista não-vazia de eventos.`);
          }
          break;
        }

        case 'quiz': {
          if (!scene.question || typeof scene.question !== 'string') {
            errors.push(`${prefix} (quiz): "question" é obrigatória.`);
          }
          if (!Array.isArray(scene.answers) || scene.answers.length < 2) {
            errors.push(`${prefix} (quiz): "answers" deve conter pelo menos 2 alternativas.`);
          }
          if (
            typeof scene.correct_index !== 'number' ||
            scene.correct_index < 0 ||
            (Array.isArray(scene.answers) && scene.correct_index >= scene.answers.length)
          ) {
            errors.push(`${prefix} (quiz): "correct_index" fora do intervalo de alternativas.`);
          }
          break;
        }

        case 'wave': {
          const params = scene.params;
          if (!params || typeof params.amplitude !== 'number' || typeof params.frequency !== 'number') {
            errors.push(`${prefix} (wave): Parâmetros amplitude e frequência são obrigatórios.`);
          }
          break;
        }

        default:
          errors.push(`${prefix}: Tipo de componente não suportado: "${(scene as any).type}".`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
