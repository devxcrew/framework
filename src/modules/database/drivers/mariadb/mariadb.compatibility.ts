import {
  OperationNodeTransformer,
  ColumnUpdateNode,
  ReferenceNode,
  DataTypeNode,
  type ColumnDefinitionNode,
  type InsertQueryNode,
  type RawNode,
  type PrimitiveValueListNode,
  type ValueNode,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
} from "kysely";

// Translate portable SQLite SQL at the database boundary.
// Values stay bound parameters; no business behavior or private package imports live here.
class MariaDbTransformer extends OperationNodeTransformer {
  protected override transformColumnDefinition(
    node: ColumnDefinitionNode,
  ): ColumnDefinitionNode {
    const transformed = super.transformColumnDefinition(node);
    if (transformed.column.column.name === "timestamp") {
      return { ...transformed, dataType: DataTypeNode.create("datetime(3)") };
    }
    if (
      DataTypeNode.is(transformed.dataType) &&
      transformed.dataType.dataType === "text"
    ) {
      const name = transformed.column.column.name;
      const indexed =
        name === "id" ||
        name === "key" ||
        name === "email" ||
        name === "name" ||
        name === "token_hash" ||
        name.endsWith("_id") ||
        name.endsWith("_at");
      return indexed
        ? { ...transformed, dataType: DataTypeNode.create("varchar(255)") }
        : transformed;
    }
    return transformed;
  }

  protected override transformInsertQuery(
    node: InsertQueryNode,
  ): InsertQueryNode {
    let transformed = super.transformInsertQuery(node);
    if (
      transformed.into?.table.identifier.name === "migrations" &&
      transformed.values
    ) {
      transformed = {
        ...transformed,
        values: new MigrationTimestampTransformer().transformNode(
          transformed.values,
        ),
      };
    }
    const conflict = transformed.onConflict;
    if (!conflict) return transformed;
    if (
      conflict.indexWhere ||
      conflict.updateWhere ||
      conflict.constraint ||
      conflict.indexExpression
    ) {
      throw new Error("Unsupported MariaDB conflict target.");
    }
    const column = conflict.columns?.[0];
    if (!conflict.updates && !column)
      throw new Error("Missing MariaDB conflict column.");
    return {
      ...transformed,
      onConflict: undefined,
      onDuplicateKey: {
        kind: "OnDuplicateKeyNode",
        updates: conflict.updates ?? [
          ColumnUpdateNode.create(column!, ReferenceNode.create(column!)),
        ],
      },
    };
  }

  protected override transformRaw(node: RawNode): RawNode {
    const transformed = super.transformRaw(node);
    return {
      ...transformed,
      sqlFragments: transformed.sqlFragments.map((fragment) =>
        fragment.replace(
          /json_group_array\(\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\)/g,
          "coalesce(json_arrayagg($1),json_array())",
        ),
      ),
    };
  }
}

function migrationTimestamp(value: unknown) {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    ? value.replace("T", " ").replace("Z", "")
    : value;
}

class MigrationTimestampTransformer extends OperationNodeTransformer {
  protected override transformValue(node: ValueNode): ValueNode {
    return { ...node, value: migrationTimestamp(node.value) };
  }
  protected override transformPrimitiveValueList(
    node: PrimitiveValueListNode,
  ): PrimitiveValueListNode {
    return { ...node, values: node.values.map(migrationTimestamp) };
  }
}

export class MariaDbCompatibilityPlugin implements KyselyPlugin {
  private readonly transformer = new MariaDbTransformer();
  transformQuery(args: PluginTransformQueryArgs) {
    return this.transformer.transformNode(args.node);
  }
  async transformResult(args: PluginTransformResultArgs) {
    return args.result;
  }
}
