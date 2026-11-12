import type { MemberUserAliasVo } from '../member';
/**
 * 家庭管理：/app/xq/family、/app/xq/family/member、/app/xq/family/permission
 *
 * 业务动作来自 XqFamilyController：info、invite、member/remove/{userId}、
 * transfer/{userId}、permission/user/{userId}、alias。
 */
import type { BaseVo, PageResult } from '../types';
import { del, get, post, put } from '@/utils/request';
import { biz, createCrudApi } from '../crud';

export interface FamilyVo extends BaseVo {
  familyName: string;
  creatorId: number | string;
  maxMemberCount?: number;
  /** 0 正常 1 停用 */
  status?: string | number;
}

export interface FamilyMemberVo extends BaseVo {
  familyId: number | string;
  userId: number | string;
  /** 角色（Integer 字典值）0 创建者 1 管理员 2 普通成员 */
  role?: number;
  joinTime?: string;
  status?: string | number;
  /** 成员昵称（后端按 userId 关联 xq_member_user 填充） */
  nickname?: string;
  avatar?: string;
  phone?: string;
  /** 是否游客 0 否 1 是 */
  isGuest?: number;
}

export interface FamilyPermissionVo extends BaseVo {
  familyId: number | string;
  memberUserId: number | string;
  categoryId?: number | string;
  /** 后端为 tinyint：0 否 1 是 */
  canView?: number;
  canEdit?: number;
  canRemind?: number;
  canExport?: number;
}

export const FamilyApi = {
  ...createCrudApi<FamilyVo>('/app/xq/family'),
  member: createCrudApi<FamilyMemberVo>('/app/xq/family/member'),
  permission: createCrudApi<FamilyPermissionVo>('/app/xq/family/permission'),

  /** 当前用户的家庭信息，无家庭返回 null */
  info() {
    return get<FamilyVo | null>('/app/xq/family', biz());
  },

  /** 家庭成员（家庭维度，含昵称/头像/手机号） */
  memberList() {
    return get<PageResult<FamilyMemberVo>>('/app/xq/family/member/list', biz());
  },

  /** 邀请成员（按手机号） */
  invite(phone: string, role: 1 | 2 = 2) {
    return post<number>('/app/xq/family/invite', biz({ data: { phone, role } }));
  },

  /** 移除成员 */
  removeMember(userId: number | string) {
    return del<void>(`/app/xq/family/member/remove/${userId}`, biz());
  },

  /** 转让管理员（仅家庭创建者） */
  transferOwner(userId: number | string) {
    return put<void>(`/app/xq/family/transfer/${userId}`, biz());
  },

  /** 某成员权限矩阵 */
  permissions(userId: number | string) {
    return get<FamilyPermissionVo[]>(`/app/xq/family/permission/user/${userId}`, biz());
  },

  /** 更新某成员权限 */
  savePermission(userId: number | string, data: Partial<FamilyPermissionVo>) {
    return put<void>(`/app/xq/family/permission/user/${userId}`, biz({ data }));
  },

  /** 化名清单 */
  aliases() {
    return get<MemberUserAliasVo[]>('/app/xq/family/alias/list', biz());
  },

  /** 新增化名 */
  addAlias(data: Partial<MemberUserAliasVo>) {
    return post<number>('/app/xq/family/alias', biz({ data }));
  },

  /** 修改化名 */
  updateAlias(id: number | string, data: Partial<MemberUserAliasVo>) {
    return put<void>(`/app/xq/family/alias/${id}`, biz({ data }));
  },

  /** 删除化名 */
  removeAlias(id: number | string) {
    return del<void>(`/app/xq/family/alias/${id}`, biz());
  },
};
