import boardService from './boardService';
import cardService from './cardService';
import columnService from './columnService';

// Exportar todos os serviços
export {
  boardService,
  cardService,
  columnService
};

// Exportar por padrão um objeto com todos os serviços para facilitar o uso
export default {
  board: boardService,
  card: cardService,
  column: columnService
};