import { assert } from "chai";

import { formFor, FormForType, FormAsModel, fromClass, fromClassArray, Validators, createFrom } from "../src/index";


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

class ModelD {
  hey: string;
  @fromClassArray(ModelC) cs: ModelC[];
}

class ModelE {
  hey: string;
  @fromClassArray(ModelC) cs: ModelC[];
  @fromClass b: ModelB;
}

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

const formForModelD = formFor(ModelD, s => {
  s.field(a => a.hey, "Hey Now");
  s.formArray(a => a.cs, "Ceeees", formForModelC);
});


// validation creators
const formForModelBWithValidation = formFor(ModelB, s => {
  s.field(a => a.field2, "Field 2", Validators.required);
});

const formForModelCWithValidation = formFor(ModelC, s => {
  s.field(a => a.hey, "Hey Now", Validators.required, Validators.isEmail);
  s.form(a => a.b, "Beee", formForModelBWithValidation);
});

const formForModelEWithValidation = formFor(ModelE, s => {
  s.field(a => a.hey, "ok", Validators.required);
  s.form(a => a.b, "Beee", formForModelBWithValidation);
  s.formArray(a => a.cs, "Ceeees", formForModelCWithValidation);
});

describe("form for", () => {
  it("creates simple fields", () => {
    const instance = formForModelA(null);

    assert(instance.field1 == null);
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
        }
      ],
    };

    const instance = formForModelD(origData);

    instance.cs[0].hey = "modified";
    instance.cs[0].b.field2 = "modified";

    instance.cs.push(formForModelC(null));

    const updated = instance.updatedModel();

    assert(origData.cs.length == 1);
    assert(origData.cs[0].hey == "hey1");
    assert(origData.cs[0].b.field2 == "f1");

    assert(updated.cs.length == 2);
    assert(updated.cs[0].hey == "modified");
    assert(updated.cs[0].b.field2 == "modified");
  });

  it("can validate everything", () => {
    const instance = formForModelEWithValidation(null);

    instance.b = formForModelBWithValidation(null);
    instance.cs.push(formForModelCWithValidation(null));

    try {
      instance.validate();
      assert.fail(); // should not ever get here..
    } catch(err) { }

    assert(instance.validation["hey"] != "", "hey is valid");
    assert((instance.b as FormForType<any>).validation["field2"] != "", "b.field2 is valid");

    const cs = instance.cs as FormForType<any>[];
    assert(cs[0].validation["hey"] != "", "cs[0].hey is valid");
    assert((cs[0].b as FormForType<any>).validation["field2"] != "", "cs[0].b.field2 is valid");
  });

  it("can validate with nulls", () => {
    const instance = formForModelEWithValidation(null);

    instance.hey = "ok";

    // we shouldn't have to validate these
    instance.b = null
    instance.cs.push(null);

    instance.validate();
  });

  it("can apply a new model on top of itself", () => {
    const old = createFrom(ModelE, {
      hey: "old",
      cs: [
        { hey: "old", b: { field2: "old" } },
      ],
      b: {
       field2: "old",
      },
    });

    const newModel = createFrom(ModelE, {
      hey: "new",
      cs: [
        { hey: "new", b: { field2: "new" } },
      ],
      b: {
       field2: "new",
      },
    });

    const instance = formForModelEWithValidation(old);
    instance.applyModel(newModel);

    assert(instance.hey == "new");
    assert(instance.b instanceof FormAsModel, "instance.b not an instance of a form");
    assert(instance.cs[0] instanceof FormAsModel, "instance.cs[0] not an instance of a form");
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

