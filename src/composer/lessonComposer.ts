/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA LESSON COMPOSER DETERMINÍSTICO (Sem IA)
 * Converte Content Packs + Método Pedagógico em sequência de lesson.json estruturada
 * Seguindo a sequência obrigatória de História (6º ano - Grécia Antiga):
 * Título -> Contexto -> Mapa -> Pólis -> Atenas -> Esparta -> Comparação -> Democracia -> Quiz -> Resumo
 */

import { LessonSpec, Scene } from '../types/lesson';
import { ContentPack } from '../knowledge/types';
import { CONTENT_PACK_GRECIA_ANTIGA } from '../knowledge/packs/history6Greece';
import { VisualValidator } from '../validator/visualValidator';
import { ApprovedLayoutId } from '../design-system/tokens';

export interface ComposerInput {
  discipline: 'history' | 'geography' | 'science' | 'math';
  grade: 6 | 7 | 8 | 9;
  topic: string;
  duration: number;
  teaching_method: 'visual' | 'summary' | 'review' | 'exercises' | 'complete';
}

export class LessonComposer {
  /**
   * Compõe a aula a partir do Knowledge Core determinístico
   */
  public static compose(input: ComposerInput): LessonSpec {
    // No MVP V1, o pack principal congelado é História - 6º Ano - Grécia Antiga
    const pack = CONTENT_PACK_GRECIA_ANTIGA;

    const scenes: Scene[] = [
      // 1. Título (Layout: 01_title)
      {
        id: 'scene-01-title',
        type: 'title',
        layout_id: '01_title',
        title: pack.title,
        subtitle: 'Cidadania, Pólis e as Raízes da Democracia Ocidental',
        badge: `História • ${pack.grade}º Ano • BNCC ${pack.bncc_skill.split(':')[0]}`,
        teacher_notes: 'Iniciar provocando a turma: o que significa ser cidadão hoje versus há 2500 anos atrás na Grécia?'
      },

      // 2. Contexto (Layout: 02_title_body)
      {
        id: 'scene-02-contexto',
        type: 'text',
        layout_id: '02_title_body',
        title: 'O Território Montanhoso e o Mar',
        content: [
          'A Grécia Antiga não era um país unificado, mas centenas de comunidades espalhadas pela Península Balcânica, ilhas do Mar Egeu e litoral da Ásia Menor.',
          'O relevo acidentado e montanhoso dificultava a comunicação por terra, incentivando a navegação marítima e a independência de cada cidade.',
          'Apesar da fragmentação territorial, os gregos compartilhavam a mesma língua, a mitologia dos deuses olímpicos e os Jogos Pan-Helênicos.'
        ],
        callout: 'Importante: A geografia montanhosa favoreceu diretamente o isolamento e o surgimento das cidades-estado autônomas (pólis).',
        teacher_notes: 'Chame a atenção dos alunos para o relevo: montanhas funcionavam como barreiras naturais entre as cidades.'
      },

      // 3. Mapa (Layout: 07_map)
      {
        id: 'scene-03-mapa',
        type: 'map',
        layout_id: '07_map',
        title: 'Mapa do Mar Egeu e Principais Pólis',
        resource_id: 'map-greece-001',
        source_citation: 'BNCC/MEC (EF06HI09)',
        params: {
          region_name: 'Península Balcânica e Mar Egeu',
          focus_points: [
            { name: 'Atenas', lat: 37.98, lon: 23.72, region: 'Ática', role: 'Comércio marítimo, filosofia e nascimento da Democracia.' },
            { name: 'Esparta', lat: 37.07, lon: 22.42, region: 'Peloponeso', role: 'Sociedade militar agrária e poder oligárquico dos gerontes.' },
            { name: 'Olímpia', lat: 37.64, lon: 21.62, region: 'Élide', role: 'Santuário de Zeus e sede dos Jogos Olímpicos sagrados.' },
            { name: 'Delfos', lat: 38.48, lon: 22.50, region: 'Fócida', role: 'Oráculo de Apolo, centro religioso de consulta pan-helênica.' }
          ],
          historical_notes: 'Observe a proximidade com o mar: Atenas utilizava o porto do Pireu para dominar as rotas de comércio marítimo.'
        },
        teacher_notes: 'Peça para um aluno localizar Atenas e Esparta e notar a distância geográfica e de relevo entre a Ática e a Lacônia.'
      },

      // 4. Pólis (Layout: 02_title_body)
      {
        id: 'scene-04-polis',
        type: 'text',
        layout_id: '02_title_body',
        title: 'A Pólis: A Cidade-Estado Soberana',
        content: [
          'A pólis era uma comunidade política autônoma com suas próprias leis, moeda, exército e sistema de governo.',
          'Espaço Cívico: A Ágora (praça pública central) era o coração da vida social e dos debates políticos.',
          'Acrópole: Parte mais alta da cidade fortificada, onde se erguiam os templos religiosos e servia de refúgio militar.',
          'O termo grego "politeia" deu origem às nossas palavras contemporâneas "política" e "polícia".'
        ],
        bullets: [
          'Autonomia jurídica e moedas exclusivas',
          'Ágora como praça de deliberação',
          'Acrópole como centro cívico e sagrado',
          'Cidadão = participante ativo da cidade'
        ],
        teacher_notes: 'Conecte com a palavra política: fazer política significava cuidar dos destinos da sua cidade (pólis).'
      },

      // 5. Atenas (Layout: 02_title_body)
      {
        id: 'scene-05-atenas',
        type: 'text',
        layout_id: '02_title_body',
        title: 'Atenas: O Berço da Democracia Direta',
        content: [
          'Localizada na planície da Ática, Atenas construiu sua força no comércio marítimo e naval.',
          'Após reformas de Sólon e Clístenes (508 a.C.), instaurou a Democracia: o poder de decisão residia na Eclésia (assembleia popular).',
          'Qualquer cidadão ateniense podia discursar e votar diretamente, sem deputados ou intermediários.'
        ],
        callout: 'Limite crucial da cidadania ateniense: Somente homens livres, maiores de idade e filhos de pais atenienses votavam. Mulheres, estrangeiros (metecos) e escravizados não tinham direitos políticos.',
        teacher_notes: 'Enfatize: a democracia ateniense era DIRETA, mas altamente EXCLUDENTE (apenas ~10% da população participava).'
      },

      // 6. Esparta (Layout: 02_title_body)
      {
        id: 'scene-06-esparta',
        type: 'text',
        layout_id: '02_title_body',
        title: 'Esparta: Disciplina Militar e Oligarquia',
        content: [
          'Fundada no fértil vale do rio Eurotas (Peloponeso), Esparta era governada por uma Oligarquia (governo de poucos).',
          'Os esparciatas (homens de armas) dedicavam a vida exclusivamente ao exército e ao Estado desde os 7 anos de idade na Agogê.',
          'A produção de alimentos dependia dos Hilotas: servos agrícolas que pertenciam ao Estado espartano.'
        ],
        bullets: [
          'Gerúsia: conselho de 28 anciãos',
          'Agogê: treino físico e militar austero',
          'Hilotas: maioria da população sob servidão',
          'Mulheres tinham maior liberdade patrimonial e treino atlético'
        ],
        teacher_notes: 'Compare a posição da mulher espartana (mais autônoma e ativa) com a ateniense (confinada ao ambiente doméstico).'
      },

      // 7. Comparação (Layout: 05_comparison)
      {
        id: 'scene-07-comparacao',
        type: 'comparison',
        layout_id: '05_comparison',
        title: 'Quadro Comparativo: Atenas vs Esparta',
        source_citation: 'BNCC EF06HI09 / J-P Vernant',
        params: {
          columns: ['Critério', 'Atenas', 'Esparta'],
          rows: [
            { criteria: 'Forma de Governo', atenas: 'Democracia Direta (Eclésia)', esparta: 'Oligarquia Militar (Gerúsia)' },
            { criteria: 'Base Econômica', atenas: 'Comércio marítimo e manufaturas', esparta: 'Agricultura servil de subsistência' },
            { criteria: 'Educação (Paideia)', atenas: 'Filosofia, oratória, artes e corpo', esparta: 'Agogê: disciplina guerreira rigorosa' },
            { criteria: 'Papel da Mulher', atenas: 'Restrita ao espaço doméstico (Gineceu)', esparta: 'Treino físico, autonomia e gestão' },
            { criteria: 'Mão de Obra', atenas: 'Escravizados e artesãos livres', esparta: 'Hilotas (servos públicos do Estado)' }
          ],
          conclusion: 'Enquanto Atenas investiu na retórica e no comércio, Esparta priorizou a coesão militar e o controle das terras.'
        },
        teacher_notes: 'Percorra cada linha do quadro e peça para os alunos apontarem as principais diferenças filosóficas entre as cidades.'
      },

      // 8. Democracia: Significado e Limites (Layout: 02_title_body)
      {
        id: 'scene-08-democracia',
        type: 'text',
        layout_id: '02_title_body',
        title: 'Cidadania Ontem e Hoje: O Legado Grego',
        content: [
          'Demos (povo) + Kratos (poder): A palavra que inventou o direito de debater os rumos da comunidade humana.',
          'Hoje vivemos em Democracias Representativas: elegemos representantes através do voto universal (homens e mulheres com igual valor).',
          'Na Grécia Antiga, o debate na Ágora lançou as bases do pensamento crítico, da filosofia e do questionamento racional do mundo.'
        ],
        callout: 'Reflexão crítica: A democracia moderna superou a exclusão de gênero e a escravidão, mas herdou dos gregos o princípio de que o poder deve emanar dos cidadãos.',
        teacher_notes: 'Finalize a aula conectando a matéria com o exercício do voto e dos direitos humanos atuais.'
      },

      // 9. Quiz de Fixação Formativa (Layout: 10_quiz)
      {
        id: 'scene-09-quiz',
        type: 'quiz',
        layout_id: '10_quiz',
        title: 'Verificação Formativa de Aprendizagem',
        question: 'Qual das seguintes afirmações representa com rigor histórico a democracia na Atenas Antiga?',
        answers: [
          'Todos os homens e mulheres votavam por meio de representantes eleitos',
          'Era uma democracia direta exercida apenas por homens livres e atenienses',
          'Era uma monarquia militar onde os hilotas elegiam os generais anualmente',
          'Apenas os comerciantes marítimos estrangeiros tinham direito à palavra na assembleia'
        ],
        correct_index: 1,
        explanation: 'Exato! A democracia ateniense era direta (o cidadão votava sem intermediários), mas restrita aos politai (homens livres, adultos e atenienses). Mulheres, metecos e escravizados estavam excluídos.'
      },

      // 10. Resumo e Consolidação (Layout: 11_summary)
      {
        id: 'scene-10-resumo',
        type: 'summary',
        layout_id: '11_summary',
        title: 'Síntese da Aula e Próximos Passos',
        takeaways: [
          'A pólis era a cidade-estado independente com leis e moeda próprias.',
          'O relevo montanhoso estimulou a fragmentação política e o comércio no Mar Egeu.',
          'Atenas desenvolveu a democracia direta, oratória e navegação comercial.',
          'Esparta estruturou-se em torno do militarismo austero e da oligarquia.'
        ],
        next_steps: 'As Guerras Médicas (conflito contra o Império Persa) e a Guerra do Peloponeso.'
      }
    ];

    // PASSAGEM PELO VISUAL VALIDATOR DETERMINÍSTICO
    const validatedScenes: Scene[] = [];
    for (const sc of scenes) {
      const layoutId = sc.layout_id || '02_title_body';
      const check = VisualValidator.validateScene(sc, layoutId);
      if (check.status === 'FAIL') {
        const { correctedScene, newScenes } = VisualValidator.autoCorrectScene(sc, layoutId);
        validatedScenes.push(correctedScene);
        if (newScenes) validatedScenes.push(...newScenes);
      } else {
        validatedScenes.push(sc);
      }
    }

    return {
      schema_version: '1.0',
      lesson_version: 1,
      renderer_version: '0.3.0',
      lesson: {
        id: `pemara-${pack.id}-${Date.now()}`,
        subject: pack.discipline,
        grade: `${pack.grade}EF`,
        topic: pack.topic,
        title: pack.title,
        duration_minutes: input.duration || 45,
        language: 'pt-BR',
        author: 'PEMARA Knowledge Core v1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generation_mode: 'MODE_A_NO_AI',
        didactic_style: input.teaching_method,
        bncc_skill: pack.bncc_skill,
        source_id: pack.sources[0]?.id,
        visual_status: 'READY'
      },
      objectives: [
        'Compreender o conceito de Pólis e a organização territorial da Grécia Antiga',
        'Comparar as estruturas sociais, políticas e educacionais de Atenas e Esparta',
        'Analisar criticamente o alcance e as exclusões da democracia direta ateniense'
      ],
      scenes: validatedScenes
    };
  }
}
