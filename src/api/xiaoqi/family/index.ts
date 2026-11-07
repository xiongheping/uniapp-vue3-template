/**
 * 家庭管理：/xiaoqi/family、/xiaoqi/family/member、/xiaoqi/family/permission
 */
import type { BaseVo } from '../types';
import { createCrudApi } from '../crud';

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
  /** 角色：owner/admin/member */
  role?: string;
  joinTime?: string;
  status?: string | number;
}

export interface FamilyPermissionVo extends BaseVo {
  familyId: number | string;
  memberUserId: number | string;
  categoryId: number | string;
  canView?: boolean;
  canEdit?: boolean;
  canRemind?: boolean;
  canExport?: boolean;
}

export const FamilyApi = {
  ...createCrudApi<FamilyVo>('/xiaoqi/family'),
  member: createCrudApi<FamilyMemberVo>('/xiaoqi/family/member'),
  permission: createCrudApi<FamilyPermissionVo>('/xiaoqi/family/permission'),
};
