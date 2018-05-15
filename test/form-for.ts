import { assert } from "chai";

import {
  formFor,
  FormForType, FormAsModel,
  fromClass,
  fromClassArray,
  Validators,
  createFrom,
  fromPropertyClass,
} from "../src/index";

class ModelA {
  field1: string;
}

class ModelB {
  field2: string;
}

class ModelC {
  hey: string;
  @fromClass b: ModelB;
}

class ModelF {
  pow: string;
}

class ModelD {
  hey: string;
  @fromClassArray(ModelC) cs: ModelC[];
  @fromPropertyClass(ModelF) f: { [key: string]: ModelF };
}

class ModelE {
  hey: string;
  @fromClassArray(ModelC) cs: ModelC[];
  @fromClass b: ModelB;
  @fromPropertyClass(ModelF) f: { [key: string]: ModelF };
}

// Test es5 functions
const formForModelES5A = formFor(ModelA, s => {
  s.field(a => { return a.field1; }, "Field 1");
});
const formForModelES5B = formFor(ModelA, s => {
  s.field(function(a) { return a.field1; }, "Field 1");
});
const formForModelES5C = formFor(ModelA, s => {
  s.field(function(a) { return a.field1;}, "Field 1");
});
const formForModelES5D = formFor(ModelA, s => {
  s.field(function(a) {return a.field1;}, "Field 1");
});

const formForModelA = formFor(ModelA, s => {
  s.field(a => a.field1, "Field 1");
});

const formForModelB = formFor(ModelB, s => {
  s.field(a => a.field2, "Field 2");
});

const formForModelC = formFor(ModelC, s => {
  s.field(a => a.hey, "Hey Now");
  s.form(a => a.b, "Beee", formForModelB);
});

const formForModelF = formFor(ModelF, s => {
  s.field(a => a.pow, "Pow");
});

const formForModelD = formFor(ModelD, s => {
  s.field(a => a.hey, "Hey Now");
  s.formArray(a => a.cs, "Ceeees", formForModelC);
  s.formProperty(a => a.f, "Pow", formForModelF);
});

// validation creators
const formForModelBWithValidation = formFor(ModelB, s => {
  s.field(a => a.field2, "Field 2", b => b.use(Validators.required));
});

const formForModelFWithValidation = formFor(ModelF, s => {
  s.requiredField(a => a.pow, "Pow");
});

const formForModelCWithValidation = formFor(ModelC, s => {
  s.field(a => a.hey, "Hey Now", b => b.use(Validators.required, Validators.isEmail));
  s.form(a => a.b, "Beee", formForModelBWithValidation);
});

const formForModelEWithValidation = formFor(ModelE, s => {
  s.field(a => a.hey, "ok", b => b.use(Validators.required));
  s.form(a => a.b, "Beee", formForModelBWithValidation);
  s.formArray(a => a.cs, "Ceeees", formForModelCWithValidation);
  s.formProperty(a => a.f, "Pow", formForModelFWithValidation);
});

describe("form for", () => {
  it("creates simple fields", () => {
    const instance = formForModelA(null);

    assert(instance.field1 == null);
  });

  it("creates simple fields with es5 field functions", () => {
    const instanceA = formForModelES5A(null);
    assert(instanceA.field1 == null);

    const instanceB = formForModelES5B(null);
    assert(instanceB.field1 == null);

    const instanceC = formForModelES5C(null);
    assert(instanceB.field1 == null);

    const instanceD = formForModelES5D(null);
    assert(instanceB.field1 == null);
  });

  it("doesn't modify existing simple fields", () => {
    const otherData = { field1: "hey" };

    const instance = formForModelA(otherData);
    instance.field1 = "now";

    assert(otherData.field1 == "hey");
  });

  it("can create sub forms", () => {
    const instance = formForModelC(null);

    assert(instance.hey == null);
    assert(instance.b instanceof FormAsModel, "not an instance of a form");

    instance.b.field2 = "hey now";

    const updated = instance.updatedModel();

    assert(updated.b instanceof ModelB);
    assert(updated.b.field2 == "hey now");
  });

  it("can handle nulls in updatedModel", () => {
    const instance = formForModelC(null);

    instance.b = null;

    const updated = instance.updatedModel();

    assert(updated.b == null);
  });

  it("can create sub forms and not modify", () => {
    const origData = {
      hey: "hey",
      b: {
        field2: "now",
      },
    };

    const instance = formForModelC(origData);

    instance.hey = "pow";
    instance.b.field2 = "powpow";

    const updated = instance.updatedModel();

    assert(origData.hey == "hey");
    assert(origData.b.field2 == "now");

    assert(updated.hey == "pow");
    assert(updated.b.field2 == "powpow");
  });

  it("can create sub forms from arrays", () => {
    const instance = formForModelD(null);

    assert(instance.hey == null);
    assert.isArray(instance.cs);

    instance.cs.push(formForModelC(null));

    const updated = instance.updatedModel();

    assert(updated.cs[0] instanceof ModelC);
  });

  it("can create sub forms from arrays and not modify", () => {
    const origData = {
      hey: "pow",
      cs: [
        {
          hey: "hey1",
          b: {
            field2: "f1",
          },
        },
      ],
      f: {
        prop1: { pow: "pow1" },
        prop2: { pow: "pow2" },
      },
    };

    const instance = formForModelD(origData);

    instance.cs[0].hey = "modified";
    instance.cs[0].b.field2 = "modified";

    instance.f["prop1"].pow = "modified";

    instance.cs.push(formForModelC(null));

    const updated = instance.updatedModel();

    assert(origData.cs.length == 1);
    assert(origData.cs[0].hey == "hey1");
    assert(origData.cs[0].b.field2 == "f1");

    assert(updated.cs.length == 2);
    assert(updated.cs[0].hey == "modified");
    assert(updated.cs[0].b.field2 == "modified");

    assert(origData.f["prop1"].pow == "pow1");

    assert(updated.f["prop1"].pow == "modified");
  });

  it("can validate everything", () => {
    const instance = formForModelEWithValidation(null);

    instance.b = formForModelBWithValidation(null);
    instance.cs.push(formForModelCWithValidation(null));
    instance.f["prop1"] = formForModelFWithValidation(null);

    try {
      instance.validate();
      assert.fail(); // should not ever get here..
    } catch (err) {}

    assert(instance.validation["hey"] != "", "hey is valid");
    assert(
      (instance.b as FormForType<any>).validation["field2"] != "",
      "b.field2 is valid",
    );
    assert(
      (instance.f["prop1"] as FormForType<any>).validation["pow"] != "",
      "f.prop1.pow is valid",
    );

    const cs = instance.cs as FormForType<any>[];
    assert(cs[0].validation["hey"] != "", "cs[0].hey is valid");
    assert(
      (cs[0].b as FormForType<any>).validation["field2"] != "",
      "cs[0].b.field2 is valid",
    );
  });

  it("can copy over validation when creating from an invalid form", () => {
    const instance = formForModelEWithValidation(null);

    instance.b = formForModelBWithValidation(null);
    instance.cs.push(formForModelCWithValidation(null));
    instance.f["prop1"] = formForModelFWithValidation(null);

    try {
      instance.validate();
    } catch (err) {}

    const newInstace = formForModelEWithValidation(instance);

    assert(newInstace.validation["hey"] != "", "hey is valid");
    assert(
      (newInstace.b as FormForType<any>).validation["field2"] != "",
      "b.field2 is valid",
    );
    assert(
      (newInstace.f["prop1"] as FormForType<any>).validation["pow"] != "",
      "f.prop1.pow is valid",
    );

    const cs = newInstace.cs as FormForType<any>[];
    assert(cs[0].validation["hey"] != "", "cs[0].hey is valid");
    assert(
      (cs[0].b as FormForType<any>).validation["field2"] != "",
      "cs[0].b.field2 is valid",
    );
  });

  it("can validate with nulls", () => {
    const instance = formForModelEWithValidation(null);

    instance.hey = "ok";

    // we shouldn't have to validate these
    instance.b = null;
    instance.cs.push(null);
    instance.f = null;

    instance.validate();
  });

  it("can apply a new model on top of itself", () => {
    const old = createFrom(ModelE, {
      hey: "old",
      cs: [{ hey: "old", b: { field2: "old" } }],
      b: {
        field2: "old",
      },
      f: {
        prop1: { pow: "old" },
      },
    });

    const newModel = createFrom(ModelE, {
      hey: "new",
      cs: [{ hey: "new", b: { field2: "new" } }],
      b: {
        field2: "new",
      },
      f: {
        prop1: { pow: "new" },
      },
    });

    const instance = formForModelEWithValidation(old);
    instance.applyModel(newModel);

    assert(instance.hey == "new");
    assert(
      instance.b instanceof FormAsModel,
      "instance.b not an instance of a form",
    );
    assert(instance.b.field2 == "new");
    assert(
      instance.f["prop1"] instanceof FormAsModel,
      "instance.f not an instance of a form",
    );
    assert(instance.f["prop1"].pow == "new");
    assert(
      instance.cs[0] instanceof FormAsModel,
      "instance.cs[0] not an instance of a form",
    );
    assert(instance.cs[0].hey == "new");
    assert(instance.cs[0].b.field2 == "new");
  });

  it("evaluates if in the builder", () => {
    class TestClass {
      pow: string;
      hey: string;
    }

    const testClassFormCreator = formFor(TestClass, s => {
      s.field(a => a.pow, "Pow");
      s.field(a => a.hey, "Hey", b => b.if(model => model.pow == "1", Validators.required));
    });

    const g = createFrom(TestClass, {
      pow: "hey",
      hey: "",
    });

    const instance = testClassFormCreator(g);

    // this should validate, since pow is not "1"
    assert.doesNotThrow(() => instance.validate());

    instance.pow = "1";

    assert.throws(() => instance.validate());

    instance.hey = "filled in";

    assert.doesNotThrow(() => instance.validate());
  });

  it("evaluates same in the builder", () => {
    class TestClass {
      pow: string;
      hey: string;
    }

    const testClassFormCreator = formFor(TestClass, s => {
      s.field(a => a.pow, "Pow");
      s.field(a => a.hey, "Hey", b => b.same(model => model.pow));
    });

    const g = createFrom(TestClass, {
      pow: "hey",
      hey: "",
    });

    const instance = testClassFormCreator(g);

    assert.throws(() => instance.validate());
    assert.include(instance.validation["hey"], "Pow");

    instance.hey = "hey";

    assert.doesNotThrow(() => instance.validate());
  });

  it("evaluates matches in the builder", () => {
    class TestClass {
      pow: string;
    }

    const testClassFormCreator = formFor(TestClass, s => {
      s.field(a => a.pow, "Pow", b => b.matches(/^hey/, "Should start with 'hey'"));
    });

    const g = createFrom(TestClass, {
      pow: "now",
    });

    const instance = testClassFormCreator(g);

    assert.throws(() => instance.validate());
    instance.pow = "hey now";

    assert.doesNotThrow(() => instance.validate());
  });

  it("can also use builders with the requiredField shortcut", () => {
    class TestClass {
      pow: string;
    }

    const testClassFormCreator = formFor(TestClass, s => {
      s.requiredField(a => a.pow, "Pow", b => b.use(Validators.isEmail));
    });

    const g = createFrom(TestClass, {
      pow: "",
    });

    const instance = testClassFormCreator(g);

    assert.throws(() => instance.validate());
    instance.pow = "hey now";

    assert.throws(() => instance.validate());

    instance.pow = "derek@derek.com"
    assert.doesNotThrow(() => instance.validate());
  });

  /*
  it("can create sub forms from arrays and not modify", () => {
    const origData = {
      hey: "hey",
      b: {
        field2: "now",
      },
    };

    const instance = formForModelC(origData);

    instance.hey = "pow";
    instance.b.field2 = "powpow";

    const updated = instance.updatedModel();

    assert(origData.hey == "hey");
    assert(origData.b.field2 == "now");

    assert(updated.hey == "pow");
    assert(updated.b.field2 == "powpow");
  });
  */
});
