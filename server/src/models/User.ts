import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, OneToMany, JoinColumn } from "typeorm";
import {v4 as uuid} from 'uuid';
import { Playlist } from "./Playlist";

@Entity("users")
class User {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column('simple-array', {array: true})
    likedsPlaylists: string[];

    @Column()
    role: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => Playlist, playlist => playlist.user_id, {
        cascade: ['insert', 'update']
    })
    @JoinColumn({name: 'user_id'})
    playlist: Playlist[];
}

export {User};