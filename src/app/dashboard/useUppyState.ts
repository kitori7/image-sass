import { Uppy } from '@uppy/core';
import type { UppyFile, Meta, Body } from '@uppy/utils/lib/UppyFile';
import { useMemo } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

// 定义 Uppy 状态的基本结构
type UppyState<TMeta extends Meta, TBody extends Body> = {
  files: Record<string, UppyFile<TMeta, TBody>>;
  meta: TMeta;
  [key: string]: unknown;
  totalProgress: number;
};

export function useUppyState<
  T,
  TMeta extends Meta = Meta,
  TBody extends Body = Record<string, never>,
>(uppy: Uppy<TMeta, TBody>, selector: (state: UppyState<TMeta, TBody>) => T) {
  const store = uppy.store;
  const subscribe = useMemo(() => store.subscribe.bind(store), [store]);
  const getSnapshot = useMemo(
    () => store.getState.bind(store) as () => UppyState<TMeta, TBody>,
    [store]
  );

  return useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, selector);
}
