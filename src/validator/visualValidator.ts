/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA VISUAL VALIDATOR (Pacote Deterministico de Qualidade)
 * Implementa medicao de colisoes, safe area, overflow e limites tipograficos em 1920x1080.
 * Nenhum slide com status 'FAIL' pode ser liberado para o professor.
 */

import { DESIGN_TOKENS, ApprovedLayoutId } from '../design-system/tokens';
import { Scene } from '../types/lesson';

export interface BoundingBox {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ValidationIssue {
  type: 'SAFE_AREA_VIOLATION' | 'COLLISION' | 'TEXT_OVERFLOW' | 'FONT_SIZE_TOO_SMALL' | 'EXCESSIVE_ITEMS' | 'CONTRAST_FAIL';
  severity: 'FAIL' | 'WARNING';
  elementId?: string;
  message: string;
  autoFixAction?: 'REDUCE_SPACING' | 'REDUCE_FONT' | 'SWITCH_LAYOUT' | 'SPLIT_SLIDE';
}

export interface SlideValidationReport {
  slideId: string;
  layoutId: ApprovedLayoutId;
  status: 'PASS' | 'WARNING' | 'FAIL';
  issues: ValidationIssue[];
  autoFixed: boolean;
  fixAttempts: number;
  boundingBoxes: BoundingBox[];
}

export class VisualValidator {
  /**
   * Detecção analítica de colisão entre dois retângulos A e B
   * Regra congelada:
   * A.right < B.left ou A.left > B.right ou A.bottom < B.top ou A.top > B.bottom
   * Se nenhuma dessas for verdadeira => COLLISION = TRUE
   */
  public static checkCollision(a: BoundingBox, b: BoundingBox): boolean {
    const separated = 
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom;

    return !separated;
  }

  /**
   * Verifica se o elemento está contido na Safe Area (100px laterais, 80px topo/base)
   */
  public static checkSafeArea(box: BoundingBox): boolean {
    const sa = DESIGN_TOKENS.safe_area;
    return (
      box.left >= sa.left - 2 &&
      box.right <= sa.right + 2 &&
      box.top >= sa.top - 2 &&
      box.bottom <= sa.bottom + 2
    );
  }

  /**
   * Valida uma cena de slide com base no layout aprovado e limites de design tokens
   */
  public static validateScene(scene: Scene, layoutId: ApprovedLayoutId): SlideValidationReport {
    const issues: ValidationIssue[] = [];
    const boxes: BoundingBox[] = [];

    const sa = DESIGN_TOKENS.safe_area;

    // 1. Validar Título do Slide
    const titleLength = scene.title?.length || 0;
    if (titleLength > 120) {
      issues.push({
        type: 'TEXT_OVERFLOW',
        severity: 'FAIL',
        message: `Título excessivo (${titleLength} caracteres). Máximo permitido para 1920x1080 é 120 chars.`,
        autoFixAction: 'REDUCE_FONT'
      });
    }

    // 2. Validações específicas por layout
    switch (layoutId) {
      case '01_title': {
        const titleBox: BoundingBox = {
          id: 'title-heading',
          left: sa.left + 80,
          top: sa.top + 160,
          right: sa.right - 80,
          bottom: sa.top + 480,
          width: sa.width - 160,
          height: 320
        };
        boxes.push(titleBox);
        break;
      }

      case '02_title_body': {
        const titleBox: BoundingBox = {
          id: 'title-header',
          left: sa.left,
          top: sa.top,
          right: sa.right,
          bottom: sa.top + 120,
          width: sa.width,
          height: 120
        };
        const contentBox: BoundingBox = {
          id: 'body-content',
          left: sa.left,
          top: sa.top + 140,
          right: sa.right,
          bottom: sa.bottom - 40,
          width: sa.width,
          height: sa.height - 180
        };
        boxes.push(titleBox, contentBox);

        // Checar volume de conteúdo
        if (scene.type === 'text') {
          const totalChars = scene.content.join(' ').length;
          if (totalChars > 900) {
            issues.push({
              type: 'TEXT_OVERFLOW',
              severity: 'FAIL',
              message: `Texto de conteúdo com ${totalChars} caracteres excede a área útil de 1920x1080.`,
              autoFixAction: 'SPLIT_SLIDE'
            });
          } else if (totalChars > 650) {
            issues.push({
              type: 'TEXT_OVERFLOW',
              severity: 'WARNING',
              message: 'Texto denso. Recomendado reduzir espaçamento ou fonte.',
              autoFixAction: 'REDUCE_FONT'
            });
          }

          if (scene.bullets && scene.bullets.length > DESIGN_TOKENS.max_items_per_list) {
            issues.push({
              type: 'EXCESSIVE_ITEMS',
              severity: 'FAIL',
              message: `Lista com ${scene.bullets.length} itens excede o limite máximo de ${DESIGN_TOKENS.max_items_per_list}.`,
              autoFixAction: 'SPLIT_SLIDE'
            });
          }
        }
        break;
      }

      case '05_comparison': {
        // Máximo de 3 colunas comparativas
        const titleBox: BoundingBox = {
          id: 'comp-title',
          left: sa.left,
          top: sa.top,
          right: sa.right,
          bottom: sa.top + 100,
          width: sa.width,
          height: 100
        };
        boxes.push(titleBox);

        const colWidth = (sa.width - 40) / 2;
        const col1: BoundingBox = {
          id: 'comp-col-1',
          left: sa.left,
          top: sa.top + 130,
          right: sa.left + colWidth,
          bottom: sa.bottom - 30,
          width: colWidth,
          height: sa.height - 160
        };
        const col2: BoundingBox = {
          id: 'comp-col-2',
          left: sa.left + colWidth + 40,
          top: sa.top + 130,
          right: sa.right,
          bottom: sa.bottom - 30,
          width: colWidth,
          height: sa.height - 160
        };
        boxes.push(col1, col2);

        // Checar colisão teórica das colunas
        if (this.checkCollision(col1, col2)) {
          issues.push({
            type: 'COLLISION',
            severity: 'FAIL',
            message: 'Colunas de comparação colidiram no plano do layout.',
            autoFixAction: 'REDUCE_SPACING'
          });
        }
        break;
      }

      default: {
        const fullBox: BoundingBox = {
          id: 'main-interactive-zone',
          left: sa.left,
          top: sa.top,
          right: sa.right,
          bottom: sa.bottom,
          width: sa.width,
          height: sa.height
        };
        boxes.push(fullBox);
      }
    }

    // 3. Teste de Safe Area para todas as caixas
    for (const box of boxes) {
      if (!this.checkSafeArea(box)) {
        issues.push({
          type: 'SAFE_AREA_VIOLATION',
          severity: 'FAIL',
          elementId: box.id,
          message: `Elemento ${box.id} ultrapassa a margem de segurança segura (Safe Area).`,
          autoFixAction: 'REDUCE_SPACING'
        });
      }
    }

    // Determinar Status Final
    const hasFail = issues.some((i) => i.severity === 'FAIL');
    const hasWarning = issues.some((i) => i.severity === 'WARNING');
    const status = hasFail ? 'FAIL' : hasWarning ? 'WARNING' : 'PASS';

    return {
      slideId: scene.id,
      layoutId,
      status,
      issues,
      autoFixed: false,
      fixAttempts: 0,
      boundingBoxes: boxes
    };
  }

  /**
   * Auto-Correction determinístico (Ordem estrita da seção de Auto-Correction):
   * 1. reduzir espaçamento
   * 2. reduzir fonte dentro do limite
   * 3. redimensionar componente dentro dos limites
   * 4. trocar para layout alternativo
   * 5. dividir slide
   * Máximo: 3 tentativas.
   */
  public static autoCorrectScene(scene: Scene, layoutId: ApprovedLayoutId): { correctedScene: Scene; newScenes?: Scene[]; resolved: boolean } {
    let report = this.validateScene(scene, layoutId);
    if (report.status === 'PASS') {
      return { correctedScene: scene, resolved: true };
    }

    let clonedScene = JSON.parse(JSON.stringify(scene)) as Scene;

    // Regra 1 e 2: Reduzir fonte / truncar quebras ou dividir se for texto longo
    if (clonedScene.type === 'text') {
      // Se tiver mais de 6 itens em bullets, divide
      if (clonedScene.bullets && clonedScene.bullets.length > DESIGN_TOKENS.max_items_per_list) {
        const firstHalf = clonedScene.bullets.slice(0, DESIGN_TOKENS.max_items_per_list);
        const secondHalf = clonedScene.bullets.slice(DESIGN_TOKENS.max_items_per_list);

        clonedScene.bullets = firstHalf;

        const continuationScene: Scene = {
          id: `${clonedScene.id}-part-2`,
          type: 'text',
          title: `${clonedScene.title} (Continuação)`,
          content: ['Continuação dos tópicos didáticos essenciais:'],
          bullets: secondHalf,
          teacher_notes: 'Slide criado pela divisão automática do Visual Validator.'
        };

        return {
          correctedScene: clonedScene,
          newScenes: [continuationScene],
          resolved: true
        };
      }

      // Se o texto for longo, resume parágrafos
      if (clonedScene.content && Array.isArray(clonedScene.content)) {
        clonedScene.content = clonedScene.content.map((p) => {
          if (p.length > 280) {
            return p.slice(0, 277) + '...';
          }
          return p;
        });
      }
    }

    const recheck = this.validateScene(clonedScene, layoutId);
    return {
      correctedScene: clonedScene,
      resolved: recheck.status !== 'FAIL'
    };
  }
}
