export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

export function requireHousehold(req, res, next) {
  if (!req.session.householdId) {
    return res.redirect('/household/setup');
  }
  next();
}

export function loadUser(req, res, next) {
  if (req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      displayName: req.session.displayName,
      avatarColor: req.session.avatarColor,
      householdId: req.session.householdId,
    };
  }
  res.locals.isAuthenticated = !!req.session.userId;
  next();
}
