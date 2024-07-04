import { useEffect, useRef } from 'react';

type EffectCallback = () => void | (() => void | undefined);

function useEffectOnce(effect: EffectCallback, deps: React.DependencyList) {
    const isFirstRun = useRef(true);
    const prevDeps = useRef(deps);

    useEffect(() => {
        const isMount = isFirstRun.current;
        isFirstRun.current = false;

        const hasDepsChanged = !isMount && deps.some((dep, index) => dep !== prevDeps.current[index]);

        if (isMount || hasDepsChanged) {
            const cleanup = effect();

            return () => {
                if (typeof cleanup === 'function') {
                    cleanup();
                }
            };
        }
        prevDeps.current = deps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

export default useEffectOnce;
