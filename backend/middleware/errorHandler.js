function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path} :`, err.message);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    return res.status(409).json({ error: `Cette valeur est déjà utilisée pour : ${field}` });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  const status = err.status || 500;
  res.status(status).json({ error: status < 500 ? err.message : 'Erreur interne du serveur' });
}

module.exports = errorHandler;
