/* eslint-disable no-use-before-define */
import { TaskEither } from "fp-ts/lib/TaskEither";
import type { Pipeline, PipelineStage, RulesUse } from "vite-plugin-md";

/**
 * Builder options are expected to be a key/value dictionary but must
 * be allowed to be an empty object
 */
export interface BuilderOptions { [key: string]: any }

/**
 * The Builder's event listener/handler
 * 
 * **Note:** remember that handlers are meant to be async
 */
export type BuilderHandler<
  O extends BuilderOptions,
  S extends PipelineStage,
> = (payload: Pipeline<S>, options: O) => Promise<Pipeline<S>>;

/**
 * **BuilderRegistration**
 * 
 * Represents a Builder API's configured _options_ which includes
 * the stage in the lifecycle that this builder will be given it's
 * execution time.
 */
export interface BuilderRegistration<
  O extends BuilderOptions, 
  S extends PipelineStage
> {
  name: Readonly<string>;
  description?: Readonly<string>;
  /** The lifecycle event/hook which this builder will respond to */
  lifecycle: S;
  /**
   * The builder's handler function which receives the _payload_ for the
   * event lifecycle hook configured and then is allowed to mutate these
   * properties and pass back a similarly structured object to continue
   * on in that pipeline stage.
   */
  handler: BuilderHandler<O, S>;

  /**
   * The options _specific_ to the builder
   */
  options: Partial<O>;

  /**
   * This isn't strictly required, but it is nice to express which rules you have used
   * modified, or added from the MarkdownIt parser.
   *
   * Note: builders should try to avoid mutating core rules; if they need a modification
   * for their purposes consider _monkey patching_ the rule so that downstream rules
   * have a better understanding of current rule state.
   */
  parserRules?: RulesUse[];

  /**
   * If this plugin needs to modify the configuration in some way at initialization
   * it can add a function here to do that. In most cases, the builder can simply
   * wait for their event hook to be called (at which point they will get the configuration
   * passed to them).
   */
  initializer?: BuilderHandler<O, "initialize">;
}

export type OptionsFor<
  T extends ConfiguredBuilder<string, {}, PipelineStage, string>
> = T extends BuilderApi<string, infer O, any>
  ? O
  : never;


/**
 * **BuilderDependency**
 * 
 */
export type BuilderDependency<
  T extends Partial<{ 
    builders: readonly ConfiguredBuilder<string, {}, PipelineStage, string>[];
  }
> = Partial<{builders: []}>> = [builder: ConfiguredBuilder<string, BuilderOptions, PipelineStage, string>, options: T];


export type BuilderDependencyApi<
    B extends readonly ConfiguredBuilder<string, {}, PipelineStage, string>[], 
    E extends string = never
  > = Omit<{
  /**
   * Allows you to state a preferred option configuration for the Builder
   * you are dependant on. This should be seen as a suggestion more than
   * a guarantee because if the end user is _also_ using this configuration,
   * their preferences will always be honored first.
   *
   * Secondarily, if _other_ Builders depend on the same Builder as you then
   * there will be
   */
  withConfig: <MB extends ConfiguredBuilder<string, {}, PipelineStage, string>>(options: MB) => BuilderDependencyApi<[...B, MB], E | "withConfig">;
  /**
   * Unlike simple configuration options for a builder dependency, those builders which
   * expose their own "hooks/callbacks" should be seen as a _promise_ by the builder that
   * your passed in function _will_ be run at the appropriate time.
   *
   * **Note:** it is possible that some Builder authors will have callback functionality
   * in their options hash but this is discouraged and unless designed carefully (aka, making
   * sure that the callback is setup as a queue which receives an unknown number of callers))
   * you may find unexpected outcomes where you're callback is overwritten by another
   * dependant Builder.
   */
  usingExposedCallback: (cb: any) => BuilderDependencyApi<B, E>;
}, E>;

/**
 * Users configure a `BuilderHandler` and we wrap this up functionality
 * with a higher-order `BuilderTask`.
 *
 * @returns TaskEither<string, Pipeline<S>>
 */
export type BuilderTask<
  S extends PipelineStage,
> = () => (payload: Pipeline<S>) => TaskEither<string, Pipeline<S>>;

/**
 * Properties which can be defined during createBuilder utility
 */
export interface BuilderMeta<D extends string = "", R extends RulesUse[] = []> {
  description?: D;
  parserRules?: R;
  initializer?: BuilderHandler<BuilderOptions, "initialize">;
}

export interface BuilderApiMeta<
  N extends string, 
  S extends PipelineStage,
  D extends string> {
  kind: "builder";
  /** About the Builder API */
  about: {
    name: Readonly<N>;
    description: Readonly<D>;
    stage: Readonly<S>;
  };
}

export type BuilderNeedsUserOptions<O extends {}, S extends PipelineStage> = (options?: Partial<O>) => BuilderRegistration<O, S>;


export type BuilderConfig = Record<PipelineStage, BuilderRegistration<BuilderOptions, PipelineStage>[] | []>;

/**
 * **ConfiguredBuilder**
 * 
 * A builder-api which has been configured with the user's options and is now ready
 * to be used as a handler.
 */
export type ConfiguredBuilder<
  TName extends string,
  TOptions extends {}, 
  TStage extends PipelineStage,
  TDescription extends string
> = (() => BuilderRegistration<TOptions,TStage>) & BuilderApiMeta<TName, TStage, TDescription>;

export type InlineBuilder = <N extends string, L extends PipelineStage>(name: N, lifecycle: L) => (payload: Pipeline<L>) => Pipeline<L>;

/**
 * **BuilderApi**
 * 
 * The `BuilderApi` is a function which receives a user's options (or none at all) and 
 * then returns a `ConfiguredBuilder`.
 * 
 * ```ts
 * // as function
 * const configured = api(options);
 * // for meta
 * const stage = api.about.lifecycle;
 * ```
 */
export type BuilderApi<
  TName extends string,
  TOptions extends BuilderOptions,
  TStage extends PipelineStage,
  TDescription extends string = "no description"
> = (
 (options?: Partial<TOptions>) => ConfiguredBuilder<TName, TOptions, TStage, TDescription>
) & BuilderApiMeta<TName, TStage, TDescription>;

export interface BuilderReadyForMeta<
  N extends string, 
  O extends BuilderOptions, 
  E extends PipelineStage
> {
  /**
   * Step 5:
   * - provide additional details describing this builder
   */
  meta<D extends string = "no description", R extends RulesUse[] = []>(m?: BuilderMeta<D, R>): BuilderApi<N, O, E, D>;
}

export interface BuilderReadyForHandler<N extends string, O extends BuilderOptions, E extends PipelineStage> {
  handler(h: BuilderHandler<O, E>): BuilderReadyForMeta<N, O, E>;
}

export interface BuilderReadyForInitializer<N extends string, O extends BuilderOptions, E extends PipelineStage> {
  /**
 * Your builder may optionally provide an _initializer_ function who's utility is
 * establishing context and configuration settings at the top of the build pipeline.
 */
  initializer(i?: BuilderHandler<O, "initialize">): BuilderReadyForHandler<N, O, E>;
}



/**
 * **BuilderReadyForOptions**
 * 
 * The **Builder API** is now "built" from a library standpoint but need to receive
 * the user's options.
 */
export interface BuilderReadyForOptions<N extends string, E extends PipelineStage> {
  /** add a _type_ for the options your builder will provide */
  options<O extends BuilderOptions = {}>(): BuilderReadyForInitializer<N, O, E>;
}

export interface CreateBuilder {
  <N extends string, E extends PipelineStage>(name: N, lifecycle: E): BuilderReadyForOptions<N,E>;
}
 