/* eslint-disable no-console */
import { describe, expect, it } from "vitest";
import type { Equal, Expect, ExpectExtends } from "@type-challenges/utils";
import type { BuilderApi, BuilderReadyForHandler, BuilderReadyForInitializer, BuilderReadyForMeta, BuilderReadyForOptions, ConfiguredBuilder } from "../src";
import { createBuilder } from "../src";

interface MyBuilderOptions {
  quantity: number;
  color: string;
}

describe("Builder API registration", () => {
  it("using createBuilder provides the correct types at each stage", async () => {
    const a = createBuilder("tst", "parsed");
    const b = a.options<MyBuilderOptions>();
    const c = b.initializer();
    const d = c
      .handler((p, o) => {
        console.log("options are:", o);
        console.log("payload is:", p);

        return Promise.resolve(p);
      });
    const complete = d.meta();

    type Expected = BuilderApi<"tst", MyBuilderOptions, "parsed">;
    type ExpectedWithValue = BuilderApi<"tst", MyBuilderOptions, "parsed", "no description">;
    type ExpArg = Parameters<Expected>[0];

    type Cases = [
      // Step A
      Expect<Equal<BuilderReadyForOptions<"tst", "parsed">, typeof a>>,
      // Step B
      Expect<Equal<BuilderReadyForInitializer<"tst", MyBuilderOptions, "parsed">, typeof b>>,
      // Step C
      Expect<Equal<BuilderReadyForHandler<"tst", MyBuilderOptions, "parsed">, typeof c>>,
      // Step D
      Expect<Equal<BuilderReadyForMeta<"tst", MyBuilderOptions, "parsed">, typeof d>>,

      // literal type is correct
      Expect<Equal<Expected, typeof complete>>,
      ExpectExtends<ExpectedWithValue, typeof complete>,
      // the function argument is correct
      Expect<Equal<ExpArg, Partial<MyBuilderOptions> | undefined>>,
    ];
    const cases: Cases = [true, true, true, true, true, true, true];
    expect(cases).toBe(cases);
  });

  it('using createBuilder provides an "about" hash with correct values', () => {
    const builder = createBuilder("foo", "parsed")
      .options<{ color: string }>()
      .initializer()
      .handler(p => Promise.resolve(p))
      .meta({
        description: "this is a test",
      });


    expect(builder.about).toBeDefined();
    expect(builder.about.description).toBe("this is a test");
    expect(builder.about.stage).toBe("parsed");
  });

  
  it("ReturnType of BuilderAPI provides BuilderRegistration, passing options provides ConfiguredBuilder", () => {
    const builder = createBuilder("foo", "parsed")
    .options<{ color: string }>()
    .initializer()
    .handler(p => Promise.resolve(p))
    .meta({
      description: "this is a test",
    });
    expect(builder.about.stage).toBe("parsed");

    const configured = builder({color: "green"});
    expect(configured.about.stage).toBe("parsed");
    
    const ready = configured();
    expect(ready.description).toBe("this is a test");
    expect(ready.options.color).toBe("green");

    type B = typeof builder;
    type R = ReturnType<B>;

    type cases = [
      Expect<Equal<B, BuilderApi<"foo", {color: string}, "parsed", "this is a test">>>,
      Expect<Equal<R, ConfiguredBuilder<"foo", {color: string}, "parsed", "this is a test">>>,
    ];
    const cases: cases = [ true, true];
  });

  
  it("BuilderAPI returns a ConfiguredBuilder", () => {
    const builder = createBuilder("foo", "parsed")
    .options<{ color: string }>()
    .initializer()
    .handler(p => Promise.resolve(p))
    .meta({
      description: "this is a test",
    });
    const config = builder({ color: "green" });
    
    type cases = [
      Expect<Equal<typeof config, ConfiguredBuilder<"foo", { color: string }, "parsed", "this is a test">>>
    ];
    const cases: cases = [true];
  });
  

});
