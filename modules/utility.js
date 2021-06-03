export function getCurrentToken() {
  // noinspection JSUnresolvedVariable
  if (typeof(token) !== "undefined") {
    // noinspection JSUnresolvedVariable
    return token;
  } else {
    // noinspection JSUnresolvedVariable
    if (canvas.tokens.controlled.length > 0) {
      // noinspection JSUnresolvedVariable
      return canvas.tokens.controlled[0];
    } else {
      const activeTokens = game.user?.character?.getActiveTokens();
      if (activeTokens) {
        return activeTokens[0];
      } else {
        return undefined;
      }
    }
  }
}