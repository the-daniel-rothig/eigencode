type Component = any;

type InlineProp<T> = {
  map: <T2>(mapper: (value: T) => T2) => InlineProp<T2>,
  from: (propId: any) => InlineProp<T>,
  combine: <T2>(other: InlineProp<any> | InlineProp<any>[], mapper: (...values: any[]) => T2) => CombinedInlineProp<T2>
}

type CombinedInlineProp<T> = {
  map: <T2>(mapper: (value: T) => T2) => CombinedInlineProp<T2>
}

type Strings = string[] 

declare function withInlineProps<T extends string[]>(...args: T) :
  (rawComponent: Component) => [ Component, {[key in T[number]]: InlineProp<any>} ];

declare function withInlineProps
  <Q extends string[] | string, T extends {[key: string]: Q}>
  (keys: T) :
  (rawComponent: Component) => [ Component, {[key1 in keyof T]: {[key2 in T[key1] extends string ? T[key1] : T[key1][number]]: InlineProp<any>}}]
  
export default withInlineProps;