/*
 * Created on Sun Jul 05 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenStruct } from "./open-struct";
import { Converter, ObjectMapper } from "json-proxy-mapper";
import { OpenLinkType } from "../../../open/open-link-type";
import { StructBase } from "../../struct-base";
import { OpenPostListStruct, OpenPostStruct, OpenPostDataStruct } from "./open-post-struct";
import { Long } from "bson";
import { LinkReactionType } from "../../open/open-link-struct";

export enum OpenSearchType {

    PROFILE = 'p',
    DIRECT = 'd',
    GROUP = 'm'

}

export interface OpenSearchStruct extends OpenStruct {

    page: number;
    count: number;

    totalCount: number;

    itemList: OpenSearchStruct.LinkItem[];

    pageReferrer: string;

}

export namespace OpenSearchStruct {
    
    export interface LinkItem extends StructBase {

        linkName: string;
        linkType: OpenLinkType,
        linkURL: string;
        linkImageURL: string;
        
        locked: boolean;

        memberCount?: number;

        description?: string;
        tagList: string[];

        ownerNickname: string;
        ownerProfileImageURL: string;

        lastChatAt?: number;

        reactCount: number;
    }

    export namespace LinkItem {
        
        export const Mappings = {

            linkName: 'ln',
            linkType: 'lt',
            linkURL: 'lu',
            linkImageURL: 'liu',
            memberCount: 'mcnt',

            description: 'desc',
            tagList: 'tags',

            locked: 'lk',

            ownerNickname: 'nn',
            ownerProfileImageURL: 'pi',

            lastChatAt: 'writtenAt',

            reactCount: 'rc',
    
        }

        export const MAPPER = new ObjectMapper(Mappings);

    }


    export interface PostItem extends StructBase {

        id: Long;
        linkId: number;

        nickname: string;
        profileImageURL: string;
    
        description: { text: string, tags: string[] };
        postDataList?: OpenPostDataStruct[];
    
        date: number;
        reactionList: { type: LinkReactionType, count: number }[];
        
    }
    
    export namespace PostItem {
    
        export const Mappings = {
    
            id: 'postId',
            linkId: 'linkId',

            nickname: 'nickname',
            profileImageURL: 'profileImagePath',
    
            description: 'postDescription',
            postDataList: 'postDatas',
    
            reactionList: 'reacts'

        }
    
        export const MAPPER = new ObjectMapper(Mappings);
        
    }



    export const Mappings = {

        page: 'page',
        count: 'count',
        totalCount: 'totalCount',
        itemList: 'items',
        pageReferrer: 'apr'

    }

    export const ConvertMap = {

        itemList: new Converter.Array(LinkItem.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export interface OpenPostSearchStruct extends OpenStruct {

    page: number;
    count: number;

    totalCount: number;

    postList: OpenSearchStruct.PostItem[];

    pageReferrer: string;

}

export namespace OpenPostSearchStruct {

    export const Mappings = {

        page: 'page',
        count: 'count',
        
        totalCount: 'totalCount',

        postList: 'postItems',
        pageReferrer: 'apr'

    }

    export const ConvertMap = {

        postList: new Converter.Array(OpenSearchStruct.PostItem.Mappings)

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}