// Stub: Lovable Cloud auth is not enabled in this project. The exported
// `lovable.auth.signInWithOAuth` throws so login/signup pages can still
// import the module and render without a build-time module-not-found error.

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      _provider: "google" | "apple" | "microsoft" | "lovable",
      _opts?: SignInOptions,
    ) => {
      return {
        redirected: false,
        error: new Error(
          "Lovable Cloud auth is not enabled in this project. Enable Cloud to use OAuth sign-in.",
        ),
      };
    },
  },
};
