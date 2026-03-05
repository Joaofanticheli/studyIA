const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  criarCurso, criarCursoCustom, criarCursoDoTexto, getMeusCursos, getCurso, getAula, concluirAula, deletarCurso, avaliarDiscursiva, regenerarQuiz, regenerarVideo, getTemplates, criarCursoDoTemplate, getSugestao,
} = require('../controllers/courseController');

router.use(protect);

router.post('/quiz/corrigir', avaliarDiscursiva);
router.get('/templates', getTemplates);
router.post('/templates/:templateId', criarCursoDoTemplate);
router.post('/', criarCurso);
router.post('/custom', criarCursoCustom);
router.post('/from-text', criarCursoDoTexto);
router.get('/', getMeusCursos);
router.get('/:id/sugestao', getSugestao);
router.get('/:id', getCurso);
router.get('/:id/modulos/:moduloIdx/aulas/:aulaIdx', getAula);
router.post('/:id/modulos/:moduloIdx/aulas/:aulaIdx/concluir', concluirAula);
router.post('/:id/modulos/:moduloIdx/aulas/:aulaIdx/regenerar-quiz', regenerarQuiz);
router.post('/:id/modulos/:moduloIdx/aulas/:aulaIdx/regenerar-video', regenerarVideo);
router.delete('/:id', deletarCurso);

module.exports = router;
