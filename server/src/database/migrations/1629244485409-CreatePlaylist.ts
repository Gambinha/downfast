import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class CreatePlaylist1629244485409 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'playlists',
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "title",
                    type: "varchar"
                },
                {
                    name: "genre",
                    type: 'varchar'
                },
                {
                    name: "security",
                    type: "varchar"
                },
                {
                    name: "likes",
                    type: "int"
                },
                {
                    name: "videos",
                    type: "varchar"
                },
                {
                    name: "keywords",
                    type: "varchar"
                },
                {
                    name: "user_id",
                    type: "uuid"
                }
            ],
            foreignKeys: [
                {
                    name: "UserPlaylist",
                    columnNames: ["user_id"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE"
                }
            ]
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("playlists");
    }

}
