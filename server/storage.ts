import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type Community, 
  type InsertCommunity,
  type Message,
  type InsertMessage,
  type Article,
  type InsertArticle,
  type CommunityMember,
  type InsertCommunityMember,
  type SavedArticle,
  type InsertSavedArticle,
  type CommunityWithAuthor,
  type MessageWithAuthor,
  type ArticleWithAuthor,
  users,
  communities,
  communityMembers,
  messages,
  articles,
  savedArticles
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Communities
  getCommunity(id: string): Promise<Community | undefined>;
  getCommunities(search?: string): Promise<CommunityWithAuthor[]>;
  getUserCommunities(userId: string): Promise<CommunityWithAuthor[]>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: string, community: Partial<InsertCommunity>): Promise<Community | undefined>;

  // Community Members
  joinCommunity(communityId: string, userId: string): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<boolean>;
  getCommunityMembers(communityId: string): Promise<User[]>;
  isUserInCommunity(communityId: string, userId: string): Promise<boolean>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getCommunityMessages(communityId: string, limit?: number): Promise<MessageWithAuthor[]>;
  getDirectMessages(userId1: string, userId2: string, limit?: number): Promise<MessageWithAuthor[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Articles
  getArticle(id: string): Promise<Article | undefined>;
  getArticles(search?: string, authorId?: string): Promise<ArticleWithAuthor[]>;
  getUserArticles(userId: string): Promise<ArticleWithAuthor[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  likeArticle(id: string): Promise<Article | undefined>;
  
  // Saved Articles
  saveArticle(userId: string, articleId: string): Promise<SavedArticle>;
  unsaveArticle(userId: string, articleId: string): Promise<boolean>;
  getSavedArticles(userId: string): Promise<ArticleWithAuthor[]>;
  isArticleSaved(userId: string, articleId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private communities: Map<string, Community> = new Map();
  private communityMembers: Map<string, CommunityMember> = new Map();
  private messages: Map<string, Message> = new Map();
  private articles: Map<string, Article> = new Map();
  private savedArticles: Map<string, SavedArticle> = new Map();

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: insertUser.profileImageUrl ?? null,
      name: insertUser.name ?? null,
      avatar: insertUser.avatar ?? null,
      title: insertUser.title ?? null,
      location: insertUser.location ?? null,
      bio: insertUser.bio ?? null,
      skills: insertUser.skills ? [...insertUser.skills] : null,
      github: insertUser.github ?? null,
      linkedin: insertUser.linkedin ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const cleanUpdateData = {
      ...updateData,
      title: updateData.title !== undefined ? updateData.title : user.title,
      location: updateData.location !== undefined ? updateData.location : user.location,
      avatar: updateData.avatar !== undefined ? updateData.avatar : user.avatar,
      bio: updateData.bio !== undefined ? updateData.bio : user.bio,
      skills: updateData.skills !== undefined ? (updateData.skills ? [...updateData.skills] : null) : user.skills,
      github: updateData.github !== undefined ? updateData.github : user.github,
      linkedin: updateData.linkedin !== undefined ? updateData.linkedin : user.linkedin,
    };
    
    const updatedUser = { ...user, ...cleanUpdateData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    // If user has an id, try to update existing user
    if (upsertUser.id) {
      const existingUser = this.users.get(upsertUser.id);
      if (existingUser) {
        const updatedUser = { 
          ...existingUser, 
          ...upsertUser, 
          updatedAt: new Date() 
        };
        this.users.set(upsertUser.id, updatedUser);
        return updatedUser;
      }
    }
    
    // If user doesn't exist or no id provided, create new user
    const id = upsertUser.id || randomUUID();
    const user: User = {
      id,
      email: upsertUser.email || null,
      firstName: upsertUser.firstName || null,
      lastName: upsertUser.lastName || null,
      profileImageUrl: upsertUser.profileImageUrl || null,
      name: upsertUser.name || null,
      avatar: upsertUser.avatar || null,
      title: upsertUser.title || null,
      location: upsertUser.location || null,
      bio: upsertUser.bio || null,
      skills: upsertUser.skills ? [...upsertUser.skills] : null,
      github: upsertUser.github || null,
      linkedin: upsertUser.linkedin || null,
      createdAt: upsertUser.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(id, user);
    return user;
  }

  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunities(search?: string): Promise<CommunityWithAuthor[]> {
    let communities = Array.from(this.communities.values());
    
    if (search) {
      communities = communities.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return Promise.all(communities.map(async (community) => {
      const author = await this.getUser(community.createdBy);
      return {
        ...community,
        author: author!,
      };
    }));
  }

  async getUserCommunities(userId: string): Promise<CommunityWithAuthor[]> {
    const userMemberships = Array.from(this.communityMembers.values())
      .filter(member => member.userId === userId);
    
    const communities = await Promise.all(
      userMemberships.map(async (membership) => {
        const community = this.communities.get(membership.communityId);
        if (!community) return null;
        
        const author = await this.getUser(community.createdBy);
        return {
          ...community,
          author: author!,
          isMember: true,
        };
      })
    );

    return communities.filter(Boolean) as CommunityWithAuthor[];
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const id = randomUUID();
    const community: Community = {
      ...insertCommunity,
      image: insertCommunity.image ?? null,
      isActive: insertCommunity.isActive ?? true,
      id,
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.communities.set(id, community);
    
    // Auto-join creator
    await this.joinCommunity(id, insertCommunity.createdBy);
    
    return community;
  }

  async updateCommunity(id: string, updateData: Partial<InsertCommunity>): Promise<Community | undefined> {
    const community = this.communities.get(id);
    if (!community) return undefined;
    
    const updatedCommunity = { ...community, ...updateData, updatedAt: new Date() };
    this.communities.set(id, updatedCommunity);
    return updatedCommunity;
  }

  // Community Members
  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const id = randomUUID();
    const member: CommunityMember = {
      id,
      communityId,
      userId,
      role: 'member',
      joinedAt: new Date(),
    };
    
    this.communityMembers.set(id, member);
    
    // Update member count
    const community = this.communities.get(communityId);
    if (community) {
      community.memberCount += 1;
      this.communities.set(communityId, community);
    }
    
    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    const memberKey = Array.from(this.communityMembers.entries())
      .find(([_, member]) => member.communityId === communityId && member.userId === userId)?.[0];
    
    if (!memberKey) return false;
    
    this.communityMembers.delete(memberKey);
    
    // Update member count
    const community = this.communities.get(communityId);
    if (community && community.memberCount > 0) {
      community.memberCount -= 1;
      this.communities.set(communityId, community);
    }
    
    return true;
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    const memberIds = Array.from(this.communityMembers.values())
      .filter(member => member.communityId === communityId)
      .map(member => member.userId);
    
    const members = await Promise.all(
      memberIds.map(id => this.getUser(id))
    );
    
    return members.filter(Boolean) as User[];
  }

  async isUserInCommunity(communityId: string, userId: string): Promise<boolean> {
    return Array.from(this.communityMembers.values())
      .some(member => member.communityId === communityId && member.userId === userId);
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getCommunityMessages(communityId: string, limit = 50): Promise<MessageWithAuthor[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.communityId === communityId && message.type === 'community')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await this.getUser(message.authorId);
        return {
          ...message,
          author: author!,
        };
      })
    );

    return messagesWithAuthors.reverse();
  }

  async getDirectMessages(userId1: string, userId2: string, limit = 50): Promise<MessageWithAuthor[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => 
        message.type === 'direct' &&
        ((message.authorId === userId1 && message.recipientId === userId2) ||
         (message.authorId === userId2 && message.recipientId === userId1))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const messagesWithAuthors = await Promise.all(
      messages.map(async (message) => {
        const author = await this.getUser(message.authorId);
        return {
          ...message,
          author: author!,
        };
      })
    );

    return messagesWithAuthors.reverse();
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      communityId: insertMessage.communityId ?? null,
      recipientId: insertMessage.recipientId ?? null,
      id,
      createdAt: new Date(),
    };
    
    this.messages.set(id, message);
    return message;
  }

  // Articles
  async getArticle(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticles(search?: string, authorId?: string): Promise<ArticleWithAuthor[]> {
    let articles = Array.from(this.articles.values())
      .filter(article => article.published);
    
    if (search) {
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        article.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (authorId) {
      articles = articles.filter(article => article.authorId === authorId);
    }
    
    return Promise.all(articles.map(async (article) => {
      const author = await this.getUser(article.authorId);
      return {
        ...article,
        author: author!,
      };
    }));
  }

  async getUserArticles(userId: string): Promise<ArticleWithAuthor[]> {
    const articles = Array.from(this.articles.values())
      .filter(article => article.authorId === userId);
    
    return Promise.all(articles.map(async (article) => {
      const author = await this.getUser(article.authorId);
      return {
        ...article,
        author: author!,
      };
    }));
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      image: insertArticle.image ?? null,
      published: insertArticle.published ?? false,
      id,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: string, updateData: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, ...updateData, updatedAt: new Date() };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: string): Promise<boolean> {
    return this.articles.delete(id);
  }

  async likeArticle(id: string): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, likes: article.likes + 1 };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  // Saved Articles
  async saveArticle(userId: string, articleId: string): Promise<SavedArticle> {
    const id = randomUUID();
    const savedArticle: SavedArticle = {
      id,
      userId,
      articleId,
      savedAt: new Date(),
    };
    
    this.savedArticles.set(id, savedArticle);
    return savedArticle;
  }

  async unsaveArticle(userId: string, articleId: string): Promise<boolean> {
    const savedArticleKey = Array.from(this.savedArticles.entries())
      .find(([_, saved]) => saved.userId === userId && saved.articleId === articleId)?.[0];
    
    if (!savedArticleKey) return false;
    
    this.savedArticles.delete(savedArticleKey);
    return true;
  }

  async getSavedArticles(userId: string): Promise<ArticleWithAuthor[]> {
    const savedArticleIds = Array.from(this.savedArticles.values())
      .filter(saved => saved.userId === userId)
      .map(saved => saved.articleId);
    
    const articles = await Promise.all(
      savedArticleIds.map(id => this.getArticle(id))
    );
    
    const validArticles = articles.filter(Boolean) as Article[];
    
    return Promise.all(validArticles.map(async (article) => {
      const author = await this.getUser(article.authorId);
      return {
        ...article,
        author: author!,
      };
    }));
  }

  async isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    return Array.from(this.savedArticles.values())
      .some(saved => saved.userId === userId && saved.articleId === articleId);
  }
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    const existingUser = upsertUser.id ? await this.getUser(upsertUser.id) : null;
    
    if (existingUser) {
      const [updated] = await db
        .update(users)
        .set({ ...upsertUser, updatedAt: new Date() })
        .where(eq(users.id, upsertUser.id!))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          ...upsertUser,
          id: upsertUser.id || randomUUID(),
          createdAt: upsertUser.createdAt || new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  // Communities
  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community || undefined;
  }

  async getCommunities(search?: string): Promise<CommunityWithAuthor[]> {
    let query = db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        image: communities.image,
        category: communities.category,
        createdBy: communities.createdBy,
        memberCount: communities.memberCount,
        isActive: communities.isActive,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        author: users,
      })
      .from(communities)
      .innerJoin(users, eq(communities.createdBy, users.id))
      .where(eq(communities.isActive, true));

    if (search) {
      query = query.where(
        or(
          ilike(communities.name, `%${search}%`),
          ilike(communities.description, `%${search}%`)
        )
      );
    }

    const result = await query;
    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      category: row.category,
      createdBy: row.createdBy,
      memberCount: row.memberCount,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
    }));
  }

  async getUserCommunities(userId: string): Promise<CommunityWithAuthor[]> {
    const result = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        image: communities.image,
        category: communities.category,
        createdBy: communities.createdBy,
        memberCount: communities.memberCount,
        isActive: communities.isActive,
        createdAt: communities.createdAt,
        updatedAt: communities.updatedAt,
        author: users,
      })
      .from(communities)
      .innerJoin(users, eq(communities.createdBy, users.id))
      .innerJoin(communityMembers, eq(communityMembers.communityId, communities.id))
      .where(eq(communityMembers.userId, userId));

    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      category: row.category,
      createdBy: row.createdBy,
      memberCount: row.memberCount,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
      isMember: true,
    }));
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values({
        ...insertCommunity,
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Auto-join creator
    await this.joinCommunity(community.id, insertCommunity.createdBy);
    
    return community;
  }

  async updateCommunity(id: string, updateData: Partial<InsertCommunity>): Promise<Community | undefined> {
    const [community] = await db
      .update(communities)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(communities.id, id))
      .returning();
    return community || undefined;
  }

  // Community Members
  async joinCommunity(communityId: string, userId: string): Promise<CommunityMember> {
    const [member] = await db
      .insert(communityMembers)
      .values({
        communityId,
        userId,
        role: 'member',
        joinedAt: new Date(),
      })
      .returning();
    
    // Update member count
    await db
      .update(communities)
      .set({ 
        memberCount: count(communityMembers.id)
      })
      .where(eq(communities.id, communityId));
    
    return member;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
    
    if (result.rowCount && result.rowCount > 0) {
      // Update member count
      await db
        .update(communities)
        .set({ 
          memberCount: count(communityMembers.id)
        })
        .where(eq(communities.id, communityId));
      return true;
    }
    
    return false;
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(communityMembers, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));
    
    return result.map(row => row.user);
  }

  async isUserInCommunity(communityId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
    
    return !!member;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getCommunityMessages(communityId: string, limit = 50): Promise<MessageWithAuthor[]> {
    const result = await db
      .select({
        id: messages.id,
        content: messages.content,
        authorId: messages.authorId,
        communityId: messages.communityId,
        recipientId: messages.recipientId,
        type: messages.type,
        createdAt: messages.createdAt,
        author: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.authorId, users.id))
      .where(
        and(
          eq(messages.communityId, communityId),
          eq(messages.type, 'community')
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.reverse().map(row => ({
      id: row.id,
      content: row.content,
      authorId: row.authorId,
      communityId: row.communityId,
      recipientId: row.recipientId,
      type: row.type,
      createdAt: row.createdAt,
      author: row.author,
    }));
  }

  async getDirectMessages(userId1: string, userId2: string, limit = 50): Promise<MessageWithAuthor[]> {
    const result = await db
      .select({
        id: messages.id,
        content: messages.content,
        authorId: messages.authorId,
        communityId: messages.communityId,
        recipientId: messages.recipientId,
        type: messages.type,
        createdAt: messages.createdAt,
        author: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.authorId, users.id))
      .where(
        and(
          eq(messages.type, 'direct'),
          or(
            and(eq(messages.authorId, userId1), eq(messages.recipientId, userId2)),
            and(eq(messages.authorId, userId2), eq(messages.recipientId, userId1))
          )
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.reverse().map(row => ({
      id: row.id,
      content: row.content,
      authorId: row.authorId,
      communityId: row.communityId,
      recipientId: row.recipientId,
      type: row.type,
      createdAt: row.createdAt,
      author: row.author,
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  // Articles
  async getArticle(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async getArticles(search?: string, authorId?: string): Promise<ArticleWithAuthor[]> {
    let query = db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        excerpt: articles.excerpt,
        image: articles.image,
        category: articles.category,
        authorId: articles.authorId,
        likes: articles.likes,
        readTime: articles.readTime,
        published: articles.published,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        author: users,
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.published, true));

    if (search) {
      query = query.where(
        or(
          ilike(articles.title, `%${search}%`),
          ilike(articles.content, `%${search}%`),
          ilike(articles.category, `%${search}%`)
        )
      );
    }

    if (authorId) {
      query = query.where(eq(articles.authorId, authorId));
    }

    const result = await query;
    return result.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      image: row.image,
      category: row.category,
      authorId: row.authorId,
      likes: row.likes,
      readTime: row.readTime,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
    }));
  }

  async getUserArticles(userId: string): Promise<ArticleWithAuthor[]> {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        excerpt: articles.excerpt,
        image: articles.image,
        category: articles.category,
        authorId: articles.authorId,
        likes: articles.likes,
        readTime: articles.readTime,
        published: articles.published,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        author: users,
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.authorId, userId));

    return result.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      image: row.image,
      category: row.category,
      authorId: row.authorId,
      likes: row.likes,
      readTime: row.readTime,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
    }));
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db
      .insert(articles)
      .values({
        ...insertArticle,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return article;
  }

  async updateArticle(id: string, updateData: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article || undefined;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await db.delete(articles).where(eq(articles.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async likeArticle(id: string): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ likes: count(articles.likes) })
      .where(eq(articles.id, id))
      .returning();
    return article || undefined;
  }

  // Saved Articles
  async saveArticle(userId: string, articleId: string): Promise<SavedArticle> {
    const [savedArticle] = await db
      .insert(savedArticles)
      .values({
        userId,
        articleId,
        savedAt: new Date(),
      })
      .returning();
    return savedArticle;
  }

  async unsaveArticle(userId: string, articleId: string): Promise<boolean> {
    const result = await db
      .delete(savedArticles)
      .where(
        and(
          eq(savedArticles.userId, userId),
          eq(savedArticles.articleId, articleId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSavedArticles(userId: string): Promise<ArticleWithAuthor[]> {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        excerpt: articles.excerpt,
        image: articles.image,
        category: articles.category,
        authorId: articles.authorId,
        likes: articles.likes,
        readTime: articles.readTime,
        published: articles.published,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        author: users,
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .innerJoin(savedArticles, eq(savedArticles.articleId, articles.id))
      .where(eq(savedArticles.userId, userId));

    return result.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      image: row.image,
      category: row.category,
      authorId: row.authorId,
      likes: row.likes,
      readTime: row.readTime,
      published: row.published,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row.author,
    }));
  }

  async isArticleSaved(userId: string, articleId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedArticles)
      .where(
        and(
          eq(savedArticles.userId, userId),
          eq(savedArticles.articleId, articleId)
        )
      );
    return !!saved;
  }
}

// Initialize storage with DatabaseStorage
let storage: IStorage = new DatabaseStorage();

export { storage };