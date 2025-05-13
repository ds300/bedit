type SetterOrUpdater<T> = (val: T) => void | T;

type Editable<T, Root = T> = {
  [k in keyof T]: T[k] extends object
    ? Editable<T[k], Root>
    : (edit: T[k] | SetterOrUpdater<T[k]>) => Root;
} & ((edit: T | SetterOrUpdater<T>) => Root);

function getIn(obj: any, path: string[]): any {
  let v = obj;
  for (const p of path) {
    if (v == null) return undefined;
    v = v[p];
  }
  return v;
}

function setIn(_obj: any, path: string[], value: any): any {
  if (path.length === 0) return value;
  // do immutably, cloning only the object in the path
  let obj = Array.isArray(_obj) ? [..._obj] : { ..._obj };
  const res = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    obj[p] = Array.isArray(obj[p]) ? [...obj[p]] : { ...obj[p] };
    obj = obj[p];
  }
  const last = path[path.length - 1];
  obj[last] = value;
  return res;
}

export function edit<T>(t: T, options?: { shallow?: boolean }): Editable<T> {
  const path = [] as string[];
  function doEdit(fn: (val: T) => void | T): T {
    if (typeof fn !== "function") {
      return setIn(t, path, fn);
    }
    const _v = getIn(t, path);
    const v = options?.shallow
      ? Array.isArray(_v)
        ? _v.slice()
        : { ..._v }
      : structuredClone(_v);
    const v2 = fn(v) ?? v;

    return setIn(t, path, v2);
  }
  const $: any = new Proxy(() => {}, {
    get(_target, prop) {
      path.push(prop as string);
      return $;
    },
    apply(_target, _thisArg, [fn]) {
      return doEdit(fn);
    },
  });
  return $;
}

export { edit as bedit };
