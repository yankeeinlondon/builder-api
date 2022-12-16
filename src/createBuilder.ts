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
        /**
             * Step 3:
             * - _if_ your builder needs to initialize state in some way prior
             * to be calling by the event hook, then you should add it here
             * - this is purely optional
             */
        initializer: (initializer) => {
          return {
            /**
             * Step 4:
             * - provide the **handler function** which is called upon reaching the
             * lifecycle event you've subscribed to
             * - your handler should be an async function which will receive the payload
             * along with any options that your builder has configured
             */
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

                  // // return a function so that the consumer can add in their options
                  // const userOptions = (options: Partial<O> = {} as Partial<O>) => {
                  //     const reg =  () => { ...registration, options } as BuilderRegistration<O, E>;
                  //     return createFnWithProps(reg, apiMeta);
                  //   };

                    
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
