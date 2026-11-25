import { InsulationMaterial } from '../database/entities/insulation-materials.entity';
import { MinioStorageService } from '../storage/minio-storage.service';

export interface InsulationMaterialSerializationOptions {
  currentUserId?: number;
  likeCount?: number;
  liked?: boolean;
}

export class InsulationMaterialSerializer {
  constructor(private readonly storage: MinioStorageService) {}

  serializeList(material: InsulationMaterial, options: InsulationMaterialSerializationOptions, rich = false) {
    // Каталогу нужны ровно 7 полей. isCreator относится именно к списку услуг:
    // 1 — услугу создал текущий пользователь, 0 — другой пользователь.
    return {
      id: material.insulationMaterialId,
      name: material.name,
      imageUrl: this.storage.publicObjectUrl(material.imageUrl),
      insulationType: material.insulationType,
      thicknessMm: material.thicknessMm,
      likeCount: options.likeCount ?? 0,
      isCreator: options.currentUserId !== undefined && material.creatorId === options.currentUserId ? 1 : 0,
      ...(rich ? {
        brand: material.brand,
        application: material.application,
        priceRubM2: material.priceRubM2 === null ? null : Number(material.priceRubM2),
        publishedAt: material.publishedAt,
        shortDescription: material.shortDescription,
        videoUrl: this.storage.publicObjectUrl(material.videoUrl),
      } : {}),
    };
  }

  serializeFeed(material: InsulationMaterial, options: InsulationMaterialSerializationOptions, rich = false) {
    // Ленте нужны ровно 9 полей. Здесь нет isCreator: вместо него лента получает
    // liked — отдельный признак 0/1, поставил ли текущий пользователь лайк.
    return {
      id: material.insulationMaterialId,
      name: material.name,
      shortDescription: material.shortDescription,
      imageUrl: this.storage.publicObjectUrl(material.imageUrl),
      videoUrl: this.storage.publicObjectUrl(material.videoUrl),
      insulationType: material.insulationType,
      thicknessMm: material.thicknessMm,
      likeCount: options.likeCount ?? 0,
      liked: options.liked ? 1 : 0,
      ...(rich ? {
        brand: material.brand,
        application: material.application,
        priceRubM2: material.priceRubM2 === null ? null : Number(material.priceRubM2),
        publishedAt: material.publishedAt,
      } : {}),
    };
  }

  serialize(material: InsulationMaterial, options: InsulationMaterialSerializationOptions) {
    // ДЛЯ ЗАЩИТЫ: сериализатор преобразует ORM-сущность БД в безопасный JSON для клиента.
    // Полный вариант нужен для черновика, создания и публикации, но не для ленты.
    return {
      id: material.insulationMaterialId,
      name: material.name,
      shortDescription: material.shortDescription,
      status: material.status,
      imageFileName: material.imageUrl,
      imageUrl: this.storage.publicObjectUrl(material.imageUrl),
      videoFileName: material.videoUrl,
      videoUrl: this.storage.publicObjectUrl(material.videoUrl),
      insulationType: material.insulationType,
      thicknessMm: material.thicknessMm,
      createdAt: material.createdAt,
      publishedAt: material.publishedAt,
      completedAt: material.completedAt,
      creatorId: material.creatorId,
      moderatorId: material.moderatorId,
      isCreator: options.currentUserId !== undefined && material.creatorId === options.currentUserId ? 1 : 0,
      likeCount: options.likeCount ?? 0,
      liked: options.liked ? 1 : 0,
      brand: material.brand,
      application: material.application,
      priceRubM2: material.priceRubM2 === null ? null : Number(material.priceRubM2),
    };
  }
}
