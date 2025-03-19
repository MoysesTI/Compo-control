/**
 * Utilitários para gerenciamento de erros e feedback
 */

/**
 * Mapear códigos de erro do Firebase para mensagens amigáveis
 * @param {Error} error - Objeto de erro
 * @param {string} context - Contexto do erro (login, signup, etc.)
 * @returns {string} Mensagem amigável
 */
export const getFirebaseErrorMessage = (error, context = '') => {
    if (!error || !error.code) {
      return error?.message || 'Ocorreu um erro inesperado.';
    }
    
    // Erros comuns de autenticação
    if (context === 'auth' || context === 'login' || context === 'signup') {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'Este email já está sendo usado por outra conta.';
        case 'auth/invalid-email':
          return 'O email fornecido é inválido.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Email ou senha incorretos.';
        case 'auth/weak-password':
          return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
        case 'auth/user-disabled':
          return 'Esta conta foi desativada.';
        case 'auth/too-many-requests':
          return 'Muitas tentativas de login. Tente novamente mais tarde.';
        case 'auth/network-request-failed':
          return 'Erro de conexão com a internet. Verifique sua conexão e tente novamente.';
        default:
          return `Erro de autenticação: ${error.message}`;
      }
    }
    
    // Erros relacionados a permissões
    if (error.code.includes('permission-denied')) {
      return 'Você não tem permissão para executar esta ação.';
    }
    
    // Erros de conexão
    if (error.code.includes('network')) {
      return 'Erro de conexão com a internet. Verifique sua conexão e tente novamente.';
    }
    
    // Erros genéricos
    return error.message || 'Ocorreu um erro inesperado.';
  };
  
  /**
   * Formatar erro para log
   * @param {string} action - Ação que gerou o erro
   * @param {Error} error - Objeto de erro
   * @returns {string} Mensagem formatada para log
   */
  export const formatErrorForLog = (action, error) => {
    return `Error during ${action}: ${error.code ? `[${error.code}] ` : ''}${error.message}`;
  };
  
  /**
   * Validar dados do cartão
   * @param {Object} cardData - Dados do cartão
   * @returns {Object} { isValid, errors }
   */
  export const validateCardData = (cardData = {}) => {
    const errors = {};
    
    // Título é obrigatório
    if (!cardData.title || cardData.title.trim() === '') {
      errors.title = 'O título é obrigatório';
    }
    
    // Validar formato da data de entrega se presente
    if (cardData.dueDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
      if (!dateRegex.test(cardData.dueDate)) {
        errors.dueDate = 'Formato de data inválido';
      }
    }
    
    // Validar visibilidade
    if (cardData.visibility && cardData.visibility !== 'public' && cardData.visibility !== 'private') {
      errors.visibility = 'Visibilidade deve ser "public" ou "private"';
    }
    
    // Validar membros
    if (cardData.visibility === 'private' && 
        (!cardData.assignedTo || cardData.assignedTo.length === 0)) {
      errors.assignedTo = 'Cartões privados devem ter membros atribuídos';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  /**
   * Validar dados do quadro
   * @param {Object} boardData - Dados do quadro
   * @returns {Object} { isValid, errors }
   */
  export const validateBoardData = (boardData = {}) => {
    const errors = {};
    
    // Título é obrigatório
    if (!boardData.title || boardData.title.trim() === '') {
      errors.title = 'O título é obrigatório';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export default {
    getFirebaseErrorMessage,
    formatErrorForLog,
    validateCardData,
    validateBoardData
  };