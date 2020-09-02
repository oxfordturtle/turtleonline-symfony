// usage category data type definition
export type UsageCategory = {
  category: string
  expressions: UsageExpression[]
  total: number
}

// usage expression data type definition
export type UsageExpression = {
  name: string
  level: number
  count: number
  lines: string
}
