/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { AsyncIdStore } from "../../store/store";
import { ChatChannel, OpenChatChannel } from "./chat-channel";
import { Long } from "bson";
import { TalkClient } from "../../talk-client";
import { ChatUser } from "../user/chat-user";
import { PacketCreateChatRes, PacketCreateChatReq } from "../../packet/packet-create-chat";
import { PacketChatInfoReq, PacketChatInfoRes } from "../../packet/packet-chatinfo";
import { ChatInfoStruct } from "../struct/chat-info-struct";
import { ChatDataStruct, ChatDataBase } from "../struct/chatdata-struct";
import { PacketLeaveRes, PacketLeaveReq } from "../../packet/packet-leave";
import { ChannelType } from "../chat/channel-type";
import { StatusCode } from "../../packet/loco-packet-base";
import { PacketChatOnRoomReq, PacketChatOnRoomRes } from "../../packet/packet-chat-on-room";

export class ChannelManager extends AsyncIdStore<ChatChannel> {
    
    constructor(private client: TalkClient) {
        super();
    }

    get Client() {
        return this.client;
    }

    getChannelList() {
        return Array.from(super.values());
    }

    get(id: Long) {
        return super.get(id, true);
    }

    async createChannel(users: ChatUser[], nickname: string = '', profileURL: string = ''): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketCreateChatRes>(new PacketCreateChatReq(users.map((user) => user.Id), nickname, profileURL));

        if (this.has(res.ChannelId)) return this.get(res.ChannelId);

        let chan = this.channelFromChatData(res.ChatInfo);

        this.setCache(res.ChannelId, chan);

        return chan;
    }

    protected async fetchValue(key: Long): Promise<ChatChannel> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(key));

        return this.channelFromChatData(res.ChatInfo);
    }

    protected channelFromChatData(chatData: ChatDataBase): ChatChannel {
        let channel: ChatChannel;

        switch(chatData.Type) {

            case ChannelType.OPENCHAT_DIRECT:
            case ChannelType.OPENCHAT_GROUP: channel = new OpenChatChannel(this.client, chatData.ChannelId, chatData.Type, chatData.OpenLinkId, chatData.OpenChatToken); break;

            default: channel = new ChatChannel(this.client, chatData.ChannelId, chatData.Type); break;
            
        }

        return channel;
    }

    async requestChannelInfo(channelId: Long): Promise<ChatInfoStruct> {
        let res = await this.client.NetworkManager.requestPacketRes<PacketChatInfoRes>(new PacketChatInfoReq(channelId));

        if (res.ChatInfo.ChannelId.equals(channelId)) {
            return res.ChatInfo;
        } else {
            throw new Error('Received wrong info packet');
        }
    }

    async requestChatOnRoom(channel: ChatChannel): Promise<PacketChatOnRoomRes> {
        let packet = new PacketChatOnRoomReq(channel.Id, channel.LastChat ? channel.LastChat.LogId : Long.ZERO);

        if (channel.isOpenChat()) {
            packet.OpenChatToken = (<OpenChatChannel> channel).OpenToken;
        }

        return await this.client.NetworkManager.requestPacketRes<PacketChatOnRoomRes>(packet);
    }

    async leave(channel: ChatChannel, block: boolean = false): Promise<boolean> {
        let id = channel.Id;
        let res = await this.client.NetworkManager.requestPacketRes<PacketLeaveRes>(new PacketLeaveReq(id, block));

        if (res.StatusCode !== StatusCode.SUCCESS) return false;

        return this.syncLeft(channel);
    }

    syncLeft(channel: ChatChannel) {
        let id = channel.Id;

        if (!this.has(id)) return false;

        this.client.emit('left_channel', channel);

        this.delete(id);

        return true;
    }

    initalizeLoginData(chatDataList: ChatDataStruct[]) {
        for (let chatData of chatDataList) {
            let channel: ChatChannel = this.channelFromChatData(chatData);

            this.setCache(channel.Id, channel);
        }
    }

}