import type {
  PipelineStage, RulesUse,
} from "vite-plugin-md";
import { createFnWithProps } from "inferred-types";
import type {   BuilderApi, BuilderApiMeta, BuilderMeta, BuilderOptions, CreateBuilder } from "./types";


function createAboutSection<
  N extends string, 
  S extends PipelineStage,
  D extends string
>(name: N, description: D, stage: S): BuilderApiMeta<N,S, D> {
  return {
    kind: "builder",
    about: { name, description, stage },
  } as BuilderApiMeta<N, S, D>;
}

/**
 * A utility function to help you build a type-safe "builder".
 *
 * Step 1:
 * - provide the **name** and **lifecycle hook** you'll plug into
 * - provide a generic `<O>` which expresses the options this builder will accept
 */
export const createBuilder: CreateBuilder = <
  N extends string, 
  S extends PipelineStage
>(name: N, lifecycle: S) => {
  return {
    /**
     * Step 2:
     * - provide a generic `<O>` which expresses the options this builder will accept
     */
    options: <O extends BuilderOptions>() => {
      return {
        // initializer
        initializer: (initializer) => {
          return {
            // Handler
            handler: (handler) => {
              return {

                meta<D extends string, R extends RulesUse[]>(meta: BuilderMeta<D,R> = {} as BuilderMeta<D,R>) {
                  const apiMeta = createAboutSection(name, meta?.description || "", lifecycle);
                  const registration = {
                    ...meta,
                    name,
                    lifecycle,
                    description: meta?.description,
                    parserRules: meta?.parserRules,
                    handler,
                    initializer,
                  };

                  const api  = createFnWithProps(
                    (options: Partial<O> = {} as Partial<O>) => createFnWithProps(
                      () => ({...registration, options: options || {} as Partial<O>, ...apiMeta }),
                      apiMeta
                    ),
                    apiMeta
                  );

                  return api as unknown as BuilderApi<N, O, S, D>;
                },
              };
            },
          };
        },
      };
    },
  };
};
