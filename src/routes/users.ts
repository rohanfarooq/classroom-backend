import express from 'express';
import {or, ilike, and, sql, eq, getTableColumns, desc} from 'drizzle-orm';
import {user} from "../db/schema/index.js";
import {db} from '../db/index.js'

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {search, role, page, limit} = req.query;

        const MAX_LIMIT = 100;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const currentPage = Number.isFinite(pageNum) ? Math.max(1, Math.trunc(pageNum)) : 1;
        const limitPerPage = Math.min(
            MAX_LIMIT,
            Number.isFinite(limitNum) ? Math.max(1, Math.trunc(limitNum)) : 10
        );

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            );
        }

        if (role) {
            filterConditions.push(
                eq(user.role, role as any)
            );
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(user)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count) || 0;

        const usersList = await db
            .select({
                ...getTableColumns(user)
            })
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        });

    } catch (e) {
        console.error(`GET /users error: ${e}`);
        res.status(500).json({error: 'Failed to get users'});
    }
});

export default router;
