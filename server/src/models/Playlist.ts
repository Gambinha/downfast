import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

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

    @Column('simple-json', {array: true})
    videos: {name: string, url: string}[];

    @Column('simple-array', {array: true})
    keywords: string[]

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({name: 'user_id'})
    user_id: User;
}

export {Playlist};