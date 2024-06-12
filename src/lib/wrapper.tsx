import { h, ComponentType } from 'preact';
import { useId } from 'preact/compat';

export function WithID<T>(Component: ComponentType<T & { id: string }>): ComponentType<Omit<T, "id">> {
    return function (props: Omit<T, "id">) {
        const cProps = { ...props, id: useId() } as T & { id: string };
        return <Component {...cProps} />
    }
}