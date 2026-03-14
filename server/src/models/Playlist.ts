import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import type { User } from "./User";

@Entity("playlists")
class Playlist {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column()
    genre: string;

    @Column()
    security: string;

    @Column()
    likes: number;

    @Column('simple-json', { array: true })
    videos: { name: string, url: string }[];

    @Column('simple-array', { array: true })
    keywords: string[];

    @ManyToOne(() => require('./User').User, (user: any) => user.id)
    @JoinColumn({ name: 'user_id' })
    user_id: Relation<User>;
}

export { Playlist };
