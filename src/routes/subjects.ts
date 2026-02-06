import express from 'express';
import {or, ilike, and, sql, eq, getTableColumns, desc} from 'drizzle-orm';
import {departments, subjects} from "../db/schema";
import {db} from '../db'

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const {search, department, page, limit} = req.query;

        const MAX_LIMIT = 100;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.min(MAX_LIMIT, Math.max(1, Number(limit) || 10));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            )
        }

        if (department) {
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;
            filterConditions.push(
                ilike(departments.name, deptPattern)
            )
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({count: sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)

        const totalCount = Number(countResult[0]?.count) || 0;

        const subjectsList = await db
            .select({
                ...getTableColumns(subjects),
                department: {...getTableColumns(departments)}
            })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset)

        res.status(200).json({
            data: subjectsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage)
            }
        })

    } catch (e) {
        console.error(`GET /subjects error: ${e}`)
        res.status(500).json({error: 'Failed to get subjects'})
    }
})

export default router;