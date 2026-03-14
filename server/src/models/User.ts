import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn, Relation } from "typeorm";
import type { Playlist } from "./Playlist";

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

    @Column('simple-array', { array: true })
    likedsPlaylists: string[];

    @Column()
    role: string;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => require('./Playlist').Playlist, (playlist: any) => playlist.user_id, {
        cascade: ['insert', 'update']
    })
    @JoinColumn({ name: 'user_id' })
    playlist: Relation<Playlist[]>;
}

export { User };
