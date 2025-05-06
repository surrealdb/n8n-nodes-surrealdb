// This is a custom ESM loader to handle ES Module imports in CommonJS
// It's used to dynamically import ES modules when required by CommonJS code

module.exports = async (specifier, context, nextResolve) => {
  // For pkce-challenge and other ESM modules, use dynamic import
  if (specifier.includes('pkce-challenge')) {
    return {
      shortCircuit: true,
      url: new URL(specifier, context.parentURL).href,
      format: 'module'
    };
  }

  // For all other modules, use the default resolver
  return nextResolve(specifier);
};
