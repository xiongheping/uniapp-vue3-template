import * as AuthApi from './auth';
import * as CommonApi from './common';
import * as FamilyApi from './xiaoqi/family';
import { ItemApi } from './xiaoqi/item';
import * as MemberApi from './xiaoqi/member';
import * as NotifyApi from './xiaoqi/notify';

/** 首页 / 计划接口以对象形式直接导出（HomeApi.digest() / PlanApi.today()） */
export { HomeApi } from './xiaoqi/home';
export { MedicationApi } from './xiaoqi/medication';
export { PlanApi } from './xiaoqi/plan';

export { AuthApi, CommonApi, FamilyApi, ItemApi, MemberApi, NotifyApi };
